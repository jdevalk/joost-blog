#!/bin/bash
# Installs available updates on AlmaLinux and reboots if that is required.
#
# Without configured sites it does only that. With sites configured, it first
# puts a 503 page in front of those sites, at Cloudflare or Bunny.net, and
# removes that page again after the machine has come back up.
#
#   almalinux-update.sh --install      one-time setup (run again after changing the config)
#   almalinux-update.sh                check, update and reboot if required
#   almalinux-update.sh --after-boot   remove the page (called by systemd at boot)
#   almalinux-update.sh --page-on      show the page by hand, without a reboot
#   almalinux-update.sh --page-off     remove the page by hand
#   almalinux-update.sh --alert-test   send a test message to the alert webhook
#
# A run that fails posts its last lines of output to the webhook URL in
# /etc/almalinux-update/alert-url, if that file exists.
set -u
export LC_ALL=C

CONFIG=/etc/almalinux-update/sites.conf
STATE_DIR=/var/lib/almalinux-update
MARKER=$STATE_DIR/maintenance-active
# One line: the webhook URL that gets a message when a run fails.
ALERT_URL_FILE=/etc/almalinux-update/alert-url
ALERT_STATE=$STATE_DIR/alert-sent
INSTALL_PATH=/usr/local/sbin/almalinux-update.sh
UNIT_PATH=/etc/systemd/system/almalinux-update-page-off.service
WORKER_NAME=reboot-maintenance-page
API=https://api.cloudflare.com/client/v4
BUNNY_API=https://api.bunny.net
# Per machine: the script holds this machine's hostnames, and several machines
# can share one Bunny account.
BUNNY_SCRIPT_NAME="$WORKER_NAME-$(hostname -s)"

# Started as a regular sudoer: run the whole script again as root.
if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash -- "$0" "$@"
fi

SITES=()

# True when at least one site is configured. Without sites the script only
# updates and reboots, without a maintenance page.
have_sites() {
  [ -r "$CONFIG" ] && grep -Eqv '^(#|$)' "$CONFIG"
}

load_sites() {
  local line
  SITES=()
  if [ ! -r "$CONFIG" ]; then
    echo "Missing config: $CONFIG (run --install first)." >&2
    return 1
  fi
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    SITES+=("$line")
  done <"$CONFIG"
  if [ "${#SITES[@]}" -eq 0 ]; then
    echo "No sites configured in $CONFIG." >&2
    return 1
  fi
}

# cf TOKEN METHOD PATH [curl args...]: prints the response, fails on an API error.
# The token goes through a file descriptor so it never shows up in `ps`.
cf() {
  local token=$1 method=$2 path=$3 response
  shift 3
  response="$(curl -sS --max-time 30 -K <(printf 'header = "Authorization: Bearer %s"\n' "$token") \
    -X "$method" "$API$path" "$@")" || return 1
  if ! jq -e '.success == true' <<<"$response" >/dev/null 2>&1; then
    echo "Cloudflare API error on $method $path: $response" >&2
    return 1
  fi
  printf '%s\n' "$response"
}

# bunny KEY METHOD PATH [JSON]: prints the response body, fails on a non-2xx status.
bunny() {
  local key=$1 method=$2 path=$3 body=${4:-} out status
  local args=(-X "$method")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  out="$(curl -sS --max-time 30 -K <(printf 'header = "AccessKey: %s"\n' "$key") \
    -H 'Accept: application/json' -w '\n%{http_code}' "${args[@]}" "$BUNNY_API$path")" || return 1
  status=${out##*$'\n'}
  out=${out%$'\n'"$status"}
  case "$status" in
    2??) printf '%s\n' "$out" ;;
    *) echo "Bunny API error $status on $method $path: $out" >&2; return 1 ;;
  esac
}

# Prints the ID of our middleware script in this Bunny account, or nothing.
bunny_script_id() {
  local scripts
  scripts="$(bunny "$1" GET '/compute/script?page=1&perPage=1000')" || return 1
  jq -r --arg name "$BUNNY_SCRIPT_NAME" \
    '[.Items[] | select(.Name == $name and .ScriptType == 2) | .Id][0] // empty' <<<"$scripts"
}

# A pull zone has one middleware slot. The page takes it for the reboot and
# gives it back afterwards. The script answers in the origin phase, which only
# runs on a cache miss, so pages the CDN has in its cache keep being served.
page_on_bunny() {
  local host=$1 zone=$2 key=$3 script pullzone current
  script="$(bunny_script_id "$key")" || return 1
  if [ -z "$script" ]; then
    echo "No $BUNNY_SCRIPT_NAME script in the Bunny account of $host (run --install)." >&2
    return 1
  fi
  pullzone="$(bunny "$key" GET "/pullzone/$zone")" || return 1
  current="$(jq -r '.MiddlewareScriptId // 0' <<<"$pullzone")" || return 1
  [ "$current" = "$script" ] && return 0

  # Never replace a middleware script that is already on this pull zone.
  if [ "$current" != 0 ]; then
    echo "Existing middleware script $current on pull zone $zone, not touching it." >&2
    return 1
  fi

  # The execution phase stays as it is: origin hooks run in every phase.
  bunny "$key" POST "/pullzone/$zone" \
    "$(jq -cn --argjson s "$script" '{MiddlewareScriptId: $s}')" \
    >/dev/null
}

page_off_bunny() {
  local zone=$2 key=$3 state="$STATE_DIR/bunny-phase-$2" script pullzone phase body
  script="$(bunny_script_id "$key")" || return 1
  pullzone="$(bunny "$key" GET "/pullzone/$zone")" || return 1
  if [ -z "$script" ] || [ "$(jq -r '.MiddlewareScriptId // 0' <<<"$pullzone")" != "$script" ]; then
    rm -f "$state"
    return 0
  fi

  # Older versions of this script changed the execution phase and kept the
  # original one in a state file. Put it back if such a file is still there.
  body='{"MiddlewareScriptId": 0}'
  phase="$(cat "$state" 2>/dev/null)"
  case "$phase" in
    [0-2]) body="$(jq -cn --argjson p "$phase" '{MiddlewareScriptId: 0, EdgeScriptExecutionPhase: $p}')" ;;
  esac
  bunny "$key" POST "/pullzone/$zone" "$body" >/dev/null || return 1

  # Trust the pull zone, not the response: the page is off only once it says so.
  pullzone="$(bunny "$key" GET "/pullzone/$zone")" || return 1
  if [ "$(jq -r '.MiddlewareScriptId // 0' <<<"$pullzone")" = "$script" ]; then
    echo "Pull zone $zone still has the maintenance script attached." >&2
    return 1
  fi
  rm -f "$state"
}

# Config lines: hostname|account_id|zone_id|api_token for Cloudflare,
# hostname|bunny|pull_zone_id|api_key for Bunny.net. A fifth field, the page
# language in older configs, is ignored.
page_on_site() {
  case "$2" in
    bunny) page_on_bunny "$1" "$3" "$4" ;;
    *) page_on_cloudflare "$@" ;;
  esac
}

page_off_site() {
  case "$2" in
    bunny) page_off_bunny "$1" "$3" "$4" ;;
    *) page_off_cloudflare "$@" ;;
  esac
}

page_on_cloudflare() {
  local host=$1 zone=$3 token=$4 pattern="$1/*" routes conflicts
  routes="$(cf "$token" GET "/zones/$zone/workers/routes")" || return 1

  # Never take over or compete with an existing Worker route on this hostname.
  conflicts="$(jq -r --arg host "$host" --arg worker "$WORKER_NAME" \
    '.result[] | select((.pattern | contains($host)) and ((.script // "") != $worker)) | .pattern' \
    <<<"$routes")" || return 1
  if [ -n "$conflicts" ]; then
    echo "Existing Worker route on $host, not touching it: $conflicts" >&2
    return 1
  fi

  if jq -e --arg p "$pattern" --arg worker "$WORKER_NAME" \
    '.result | any(.pattern == $p and .script == $worker)' <<<"$routes" >/dev/null; then
    return 0
  fi

  cf "$token" POST "/zones/$zone/workers/routes" \
    -H 'Content-Type: application/json' \
    --data "$(jq -cn --arg p "$pattern" --arg s "$WORKER_NAME" '{pattern: $p, script: $s}')" \
    >/dev/null
}

page_off_cloudflare() {
  local zone=$3 token=$4 pattern="$1/*" routes id rc=0
  routes="$(cf "$token" GET "/zones/$zone/workers/routes")" || return 1
  for id in $(jq -r --arg p "$pattern" --arg worker "$WORKER_NAME" \
    '.result[] | select(.pattern == $p and .script == $worker) | .id' <<<"$routes"); do
    cf "$token" DELETE "/zones/$zone/workers/routes/$id" >/dev/null || rc=1
  done
  return "$rc"
}

page_off() {
  local site host account zone token lang rc=0
  load_sites || return 1
  for site in "${SITES[@]}"; do
    IFS='|' read -r host account zone token lang <<<"$site"
    if page_off_site "$host" "$account" "$zone" "$token"; then
      echo "Maintenance page removed from $host."
    else
      echo "Could not remove the maintenance page from $host." >&2
      rc=1
    fi
  done
  [ "$rc" -eq 0 ] && rm -f "$MARKER"
  return "$rc"
}

page_on() {
  local site host account zone token lang
  load_sites || return 1
  # Set first, so a crash halfway is still cleaned up at the next run or boot.
  touch "$MARKER" || return 1
  for site in "${SITES[@]}"; do
    IFS='|' read -r host account zone token lang <<<"$site"
    if page_on_site "$host" "$account" "$zone" "$token"; then
      echo "Maintenance page active on $host."
    else
      echo "Could not activate the maintenance page on $host." >&2
      page_off
      return 1
    fi
  done
}

# Waits up to 150 seconds for the local web server. It removes the page either
# way, because sites behind a tunnel do not answer on this address.
wait_for_sites() {
  local attempt site host rest code ready
  for attempt in $(seq 1 30); do
    ready=1
    for site in "${SITES[@]}"; do
      host=${site%%|*}
      code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 5 \
        --resolve "$host:443:127.0.0.1" "https://$host/")" || code=000
      case "$code" in [234]??) ;; *) ready=0 ;; esac
    done
    [ "$ready" -eq 1 ] && return 0
    sleep 5
  done
  echo "Local web server not answering; removing the page anyway." >&2
}

after_boot() {
  local attempt
  [ -e "$MARKER" ] || exit 0
  load_sites || exit 1
  wait_for_sites
  for attempt in $(seq 1 60); do
    page_off && exit 0
    sleep 30
  done
  echo "Giving up: the maintenance page is still active." >&2
  exit 1
}

# Returns 0 if a reboot is required, 1 if not, 2 if that cannot be determined.
reboot_required() {
  local output status
  # needs-restarting also exits 1 on errors, so match the output as well.
  output="$(dnf needs-restarting -r 2>&1)"
  status=$?
  echo "$output"
  [ "$status" -eq 0 ] && return 1
  if [ "$status" -eq 1 ] && grep -q "Reboot is required" <<<"$output"; then
    return 0
  fi
  return 2
}

# Prints the page code both providers share. The page language follows the
# visitor's browser (Accept-Language), with English as the default.
write_page_js() {
  cat <<'WORKER'
const PAGES = {
  nl: {
    title: "Even geduld",
    text: "Deze server moet helaas even opnieuw opstarten voor een beveiligingsupdate. Over een paar minuten is de site weer beschikbaar.",
  },
  en: {
    title: "Back in a few minutes",
    text: "Unfortunately, this server needs to restart for a security update. The site will be available again in a few minutes.",
  },
};

function pickLanguage(request) {
  const header = request.headers.get("accept-language") || "";
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? parseFloat(q.slice(2)) : 1 };
    })
    .filter((entry) => Object.hasOwn(PAGES, entry.lang) && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return wanted.length ? wanted[0].lang : "en";
}

function page(lang) {
  const { title, text } = PAGES[lang];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body { font: 18px/1.5 system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f7f8; color: #1f2933; }
main { max-width: 32rem; padding: 2rem; }
h1 { font-size: 1.6rem; margin: 0 0 .5rem; }
</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p>${text}</p>
</main>
</body>
</html>`;
}

function maintenance(lang) {
  return new Response(page(lang), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-language": lang,
      "retry-after": "300",
      "cache-control": "no-store",
      "vary": "accept-language",
    },
  });
}
WORKER
}

# write_worker FILE: the Cloudflare Worker. It knows no hostnames, so every
# machine in a Cloudflare account can share it. A Worker runs before the cache,
# so for GET and HEAD it first passes the request on: a cached page, or a server
# that still answers, wins. Only when that fails does the visitor get the 503.
write_worker() {
  {
    write_page_js
    cat <<'WORKER'

// How long a request may wait for the server before the page shows instead.
const ORIGIN_TIMEOUT_MS = 3000;
// Answers that mean the server is not there: its own gateway errors and
// Cloudflare's errors for an origin it cannot reach.
const DOWN = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530]);

// Returns the normal response, from the cache or from the server, or null.
// The timer only covers the wait for the first byte, never a download.
async function fromCacheOrServer(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ORIGIN_TIMEOUT_MS);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (!DOWN.has(response.status)) return response;
    if (response.body) await response.body.cancel();
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request) {
    // Anything that changes data never goes to a server that is about to stop.
    if (request.method === "GET" || request.method === "HEAD") {
      const response = await fromCacheOrServer(request);
      if (response) return response;
    }
    return maintenance(pickLanguage(request));
  },
};
WORKER
  } >"$1"
}

# write_bunny_script FILE HOSTNAMES: the Bunny.net middleware script. HOSTNAMES
# is a JSON array. The script sits on the whole pull zone, so other hostnames on
# that zone pass straight through, as do the certificate checks under
# /.well-known/. It answers in onOriginRequest, which Bunny only calls on a
# cache miss: cached pages are still served, everything else gets the 503.
write_bunny_script() {
  {
    echo 'import * as BunnySDK from "npm:@bunny.net/edgescript-sdk@0.13.0";'
    echo
    write_page_js
    printf '\nconst HOSTNAMES = %s;\n' "$2"
    cat <<'WORKER'

// The hostname the visitor asked for. Bunny does not document which of these
// an origin request carries, so look at all of them.
function requestedHosts(request) {
  const hosts = [new URL(request.url).hostname];
  for (const name of ["cdn-host", "x-forwarded-host", "host"]) {
    const value = request.headers.get(name);
    if (value) hosts.push(value.trim().toLowerCase().split(":")[0]);
  }
  return hosts;
}

BunnySDK.net.http.servePullZone().onOriginRequest(async (ctx) => {
  const url = new URL(ctx.request.url);
  const ours = requestedHosts(ctx.request).some((host) => HOSTNAMES.includes(host));
  if (!ours || url.pathname.startsWith("/.well-known/")) return ctx.request;
  return maintenance(pickLanguage(ctx.request));
});
WORKER
  } >"$1"
}

# Creates or updates the middleware script in one Bunny account.
install_bunny_script() {
  local key=$1 file=$2 script
  script="$(bunny_script_id "$key")" || return 1
  if [ -z "$script" ]; then
    script="$(bunny "$key" POST /compute/script \
      "$(jq -cn --arg n "$BUNNY_SCRIPT_NAME" '{Name: $n, ScriptType: 2, CreateLinkedPullZone: false}')" \
      | jq -r '.Id // empty')"
    [ -n "$script" ] || return 1
  fi
  bunny "$key" POST "/compute/script/$script/code" "$(jq -cn --rawfile c "$file" '{Code: $c}')" \
    >/dev/null || return 1
  bunny "$key" POST "/compute/script/$script/publish" '{"Note": ""}' >/dev/null
}

# Installs this script and the systemd service that removes the page at boot.
install_files() {
  if [ ! "$0" -ef "$INSTALL_PATH" ]; then
    install -m 755 "$0" "$INSTALL_PATH" || exit 1
  fi
  cat >"$UNIT_PATH" <<UNIT
[Unit]
Description=Remove the maintenance page after a reboot
Wants=network-online.target
After=network-online.target nginx.service httpd.service

[Service]
Type=oneshot
ExecStart=$INSTALL_PATH --after-boot

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload && systemctl enable "$(basename "$UNIT_PATH")" || exit 1
  echo "Installed. Run $INSTALL_PATH to update this machine."
}

install_self() {
  local dir worker site host account zone token lang hostnames='[]' uploaded=" " pullzone
  local command missing=()
  # Only what is missing: a plain "dnf install curl" conflicts with curl-minimal.
  for command in curl jq; do
    command -v "$command" >/dev/null 2>&1 || missing+=("$command")
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    dnf -y install "${missing[@]}" || exit 1
  fi
  mkdir -p "$(dirname "$CONFIG")" "$(dirname "$MARKER")" || exit 1

  if [ ! -e "$CONFIG" ]; then
    (umask 077; cat >"$CONFIG" <<'CONF'
# One site per line. The page shows in Dutch or English, after the visitor's browser.
#
# Cloudflare: hostname|account_id|zone_id|api_token
# Token permissions: Account > Workers Scripts > Edit and Zone > Workers Routes > Edit.
#www.example.nl|ACCOUNT_ID|ZONE_ID|API_TOKEN
#shop.example.nl|ACCOUNT_ID|ZONE_ID|API_TOKEN
#
# Bunny.net: hostname|bunny|pull_zone_id|api_key
# The second field is the literal word bunny. The API key is the account key.
#www.example.com|bunny|PULL_ZONE_ID|API_KEY
CONF
    )
    echo "Created $CONFIG."
  fi
  chmod 600 "$CONFIG" || exit 1
  if [ ! -e "$ALERT_URL_FILE" ]; then
    (umask 077; cat >"$ALERT_URL_FILE" <<'CONF'
# Webhook URL that gets a message when a run fails, for example a Slack
# incoming webhook. One URL on its own line, without the leading #.
#https://hooks.example.com/services/XXXX
CONF
    )
  fi
  chmod 600 "$ALERT_URL_FILE" || exit 1
  if ! have_sites; then
    install_files
    echo "No sites configured: this machine reboots without a maintenance page."
    echo "To add one, fill in $CONFIG and run --install again."
    exit 0
  fi
  load_sites || exit 1

  for site in "${SITES[@]}"; do
    IFS='|' read -r host account zone token lang <<<"$site"
    hostnames="$(jq -c --arg h "$host" '. + [$h]' <<<"$hostnames")" || exit 1
  done

  dir="$(mktemp -d)" || exit 1
  worker="$dir/worker.js"
  write_worker "$worker"
  write_bunny_script "$dir/bunny.js" "$hostnames"
  for site in "${SITES[@]}"; do
    IFS='|' read -r host account zone token lang <<<"$site"
    if [ "$account" = bunny ]; then
      # Catches a wrong pull zone ID now instead of at the first reboot.
      if ! pullzone="$(bunny "$token" GET "/pullzone/$zone")" ||
        ! jq -e --arg h "$host" 'any(.Hostnames[]; .Value == $h)' <<<"$pullzone" >/dev/null; then
        echo "Bunny pull zone $zone does not serve $host." >&2
        rm -rf "$dir"
        exit 1
      fi
      case "$uploaded" in *" $token "*) continue ;; esac
      if ! install_bunny_script "$token" "$dir/bunny.js"; then
        echo "Could not install the Bunny script for $host." >&2
        rm -rf "$dir"
        exit 1
      fi
      uploaded="$uploaded$token "
      echo "Bunny script published for the account of $host."
      continue
    fi
    case "$uploaded" in *" $account "*) continue ;; esac
    if ! cf "$token" PUT "/accounts/$account/workers/scripts/$WORKER_NAME" \
      -F 'metadata={"main_module":"worker.js","compatibility_date":"2026-01-01"};type=application/json' \
      -F "worker.js=@$worker;type=application/javascript+module;filename=worker.js" >/dev/null; then
      rm -rf "$dir"
      exit 1
    fi
    uploaded="$uploaded$account "
    echo "Worker uploaded to account $account."
  done
  rm -rf "$dir"

  install_files
}

update_and_reboot() {
  local status delay=5

  # A previous removal failed: clear the leftover page before doing anything else.
  if [ -e "$MARKER" ]; then
    page_off || echo "Leftover maintenance page could not be removed." >&2
  fi

  # dnf check-update: 0 = no updates, 100 = updates available, other = error.
  dnf -q --refresh check-update
  status=$?
  case "$status" in
    0)
      echo "No updates available."
      ;;
    100)
      echo "Updates available, installing."
      if ! dnf -y upgrade; then
        echo "dnf upgrade failed; not rebooting." >&2
        exit 1
      fi
      ;;
    *)
      echo "dnf check-update failed with exit code $status." >&2
      exit 1
      ;;
  esac

  reboot_required
  status=$?
  case "$status" in
    1) echo "No reboot required."; exit 0 ;;
    2) echo "Could not determine whether a reboot is required." >&2; exit 1 ;;
  esac

  echo "Reboot required."
  if have_sites; then
    if ! page_on; then
      echo "Maintenance page could not be activated; not rebooting." >&2
      exit 1
    fi
    # Gives the CDN time to roll out the page before the web server stops.
    delay=30
  else
    echo "No sites configured; rebooting without a maintenance page."
  fi
  echo "Rebooting in $delay seconds."
  # The delay also lets this script exit cleanly and report its result.
  if ! systemd-run --on-active="$delay" systemctl reboot; then
    echo "Could not schedule the reboot." >&2
    if [ -e "$MARKER" ]; then
      echo "Removing the maintenance page." >&2
      page_off
    fi
    exit 1
  fi
}

# Prints the alert webhook URL, or nothing when none is configured.
alert_url() {
  [ -r "$ALERT_URL_FILE" ] || return 0
  grep -Ev '^(#|$)' "$ALERT_URL_FILE" | head -n 1
}

# post_alert TEXT: posts {"text": TEXT} to the webhook, the format Slack and
# most chat webhooks accept. The URL goes through a file descriptor so it
# never shows up in `ps`.
post_alert() {
  local url text
  url="$(alert_url)"
  [ -n "$url" ] || return 2
  # JSON string escaping without jq, which is not installed on every machine.
  text="$(printf '%s' "$1" | LC_ALL=C tr -d '\000-\010\013-\037' | tr '\t' ' ' |
    sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | awk 'NR > 1 { printf "\\n" } { printf "%s", $0 }')"
  curl -sS -f --max-time 20 -o /dev/null -K <(printf 'url = "%s"\n' "$url") \
    -H 'Content-Type: application/json' --data "{\"text\": \"$text\"}"
}

# send_alert STATUS OUTPUT_FILE WHAT: tells the webhook that a run failed.
# While a failure lasts, it sends one alert per 24 hours, not one per run.
send_alert() {
  local now last
  [ -n "$(alert_url)" ] || return 0
  now="$(date +%s)"
  last="$(cat "$ALERT_STATE" 2>/dev/null)"
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  if [ $((now - last)) -lt 86400 ]; then
    echo "Alert not sent: one was sent less than 24 hours ago."
    return 0
  fi
  if post_alert "$(hostname): $3 failed with exit code $1. Last output:
$(tail -n 8 "$2" | cut -c1-300)"; then
    echo "Alert sent."
    mkdir -p "$STATE_DIR" && printf '%s\n' "$now" >"$ALERT_STATE"
  else
    echo "Could not send the alert." >&2
  fi
}

# with_alert WHAT FUNCTION: runs FUNCTION and sends an alert if it fails.
with_alert() {
  local what=$1 out status
  shift
  out="$(mktemp)" || exit 1
  "$@" 2>&1 | tee "$out"
  status=${PIPESTATUS[0]}
  if [ "$status" -ne 0 ]; then
    send_alert "$status" "$out" "$what"
  else
    rm -f "$ALERT_STATE"
  fi
  rm -f "$out"
  exit "$status"
}

alert_test() {
  if [ -z "$(alert_url)" ]; then
    echo "No webhook URL in $ALERT_URL_FILE." >&2
    exit 1
  fi
  if post_alert "$(hostname): test message from $(basename "$0"). Alerts work."; then
    echo "Test message sent."
  else
    echo "Could not send the test message." >&2
    exit 1
  fi
}

case "${1:-}" in
  '') with_alert "$(basename "$0")" update_and_reboot ;;
  --install) install_self ;;
  --after-boot) with_alert "$(basename "$0") --after-boot" after_boot ;;
  --page-on) page_on ;;
  --page-off) page_off ;;
  --alert-test) alert_test ;;
  *) echo "Usage: $0 [--install|--after-boot|--page-on|--page-off|--alert-test]" >&2; exit 2 ;;
esac
