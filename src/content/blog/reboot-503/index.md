---
title: A <em>503 page</em> while your server reboots
seo:
  title: A 503 maintenance page while your server reboots
  description: >-
    Automatic updates mean automatic reboots. This script has Cloudflare or
    Bunny.net serve a proper 503 page until your server is back.
  pageType: article
publishDate: 2026-11-20T00:00:00.000Z
excerpt: >-
  Nobody has time to install every update by hand anymore, so servers update
  and reboot themselves. This script has Cloudflare or Bunny.net keep cached
  pages online and answer the rest with a proper 503 page until the server is
  back.
categories:
  - Development
  - SEO
toc: false
---

Nobody has time to install every update by hand anymore, let alone to schedule them. Once a security update is out, you cannot afford to wait for a quiet moment either. So you let your servers update themselves.

That also means they reboot themselves, at moments nobody picked. A server that reboots for a kernel update is gone for a while. For most virtual servers that is less than two minutes, but sometimes it is more. In that time, your visitors get a CDN error page at best. With no CDN in front of the site they get nothing at all, because the browser cannot connect. Nothing tells them that they can just come back in a bit.

So we now let the server ask the CDN to answer for it. Pages that the CDN has in its cache stay online during the reboot. For everything else, the CDN serves a short page that says the site will be back in a few minutes, with a 503 status. After the reboot, the server removes that page again. One script does all of it, and it works with [Cloudflare](https://www.cloudflare.com/) and with [Bunny.net](https://bunny.net/).

## What a reboot looks like from the outside

Behind Cloudflare, a server that is down gives you one of the [52x errors](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/), like "521: Web server is down". That page tells your visitor that something broke. It does not tell them that this is planned and short.

For search engines, the right answer to planned downtime has been the same for years: a 503 status with a `Retry-After` header. I wrote about that [on the Yoast blog](https://yoast.com/http-503-site-maintenance-seo/). Google's documentation says it [keeps your indexed URLs](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) when it gets a 503 for a short while. You can send `Retry-After` to [tell its crawlers when to come back](https://developers.google.com/crawling/docs/crawlers-fetchers/reduce-crawl-rate).

Let's be honest about the size of the problem, though. Two minutes of downtime will not hurt your rankings. But nobody is watching when these reboots happen. I want them to give the correct answer on their own, to people and to crawlers.

## The CDN answers for the server

A server that is rebooting cannot send a maintenance page. Something else has to do that, so this only works for sites with a CDN in front of them.

The script reads its sites from a config file, `sites.conf`. That file lists the sites on the server, one per line: the hostname and the CDN details the script needs for it. While the page is on, the CDN keeps serving the pages it has in its cache. A request to one of those hostnames that needs the server gets this answer from the CDN:

- A `503` status, which says the outage is temporary.
- A `Retry-After: 300` header, which asks crawlers to come back in five minutes.
- A `Cache-Control: no-store` header, so no browser or proxy keeps the page.
- A short message that the server is restarting for a security update.

The message follows the visitor's browser language, and it can be in any language you like. The script ships with Dutch and English, with English as the default. To add your own, add it to the `PAGES` object in the script and run the installer again.

## What the script does

The script runs every five minutes from cron. Most runs only install updates. The rest happens when an update needs a reboot:

1. It installs updates. On Debian and Ubuntu that is `apt-get upgrade --with-new-pkgs`, which installs new packages but never removes one. On AlmaLinux it is `dnf upgrade`.
2. It checks whether a reboot is needed. Debian and Ubuntu look at `/run/reboot-required` and at the kernel status from `needrestart`. AlmaLinux asks `dnf needs-restarting -r`. If no reboot is needed, the run ends here.
3. It turns the page on for every hostname in `sites.conf`.
4. It waits 30 seconds and then reboots. That gives the CDN time to roll the page out before the web server stops.
5. After boot, a systemd service waits up to 150 seconds for the local web server to answer. Then it removes the page. If that fails, it tries again every 30 seconds for half an hour.

Turning the page on works differently per CDN. On Cloudflare, the script adds a Worker route for `hostname/*` that points at a small maintenance Worker. On Bunny.net, it attaches a middleware Edge Script to the pull zone.

The page is optional. A server with an empty `sites.conf` just installs updates and reboots.

## Cached pages stay online

A page that sits in the CDN's cache does not need your server. So the maintenance page only shows for requests that do: a page that is not cached, or a form that is sent. Many visitors never see it at all.

The two CDNs get there in different ways:

- On Bunny.net, the script only runs for requests that would go to your server. Bunny serves a cached page before the script is even called.
- On Cloudflare, a Worker runs before the cache. So for a `GET` or `HEAD` request, the Worker first asks Cloudflare for the page as usual. A cached page comes back at once. A server that is still up, or up again, answers as usual too. The visitor only gets the 503 when the server gives no answer within 3 seconds, or when Cloudflare reports that it is down.

That last part costs something. During the reboot, a visitor on a page that is not cached waits up to 3 seconds before the maintenance page shows. Other requests, like a `POST`, get the 503 right away on Cloudflare. They change data, and you do not want to send those to a server that is about to stop.

## What it refuses to do

A script that reboots servers and changes CDN settings on its own has to be careful. This one has a few rules:

- It never touches an existing Worker route or middleware script. If a hostname already has one, the page cannot go on, so that server does not reboot.
- It never reboots with half the sites covered. If the page fails on one site, the script removes it from the others, stops without rebooting and sends you an alert.
- It never leaves a page behind on purpose. A marker file survives the reboot, and a page that could not be removed is removed at the next run, five minutes later.
- On Debian and Ubuntu, it never starts a release upgrade. If the package sources point at another release than the installed one, it does not touch any packages.
- On Debian and Ubuntu, the installer never upgrades packages on the side. If installing `curl`, `jq` or `needrestart` would upgrade something that is already there, it stops and asks you to install them by hand.

The first rule has one gap, on Cloudflare. The script only sees routes that name the hostname itself. It does not see a wildcard route like `*.example.nl/*`. Cloudflare picks the most specific route, so while the page is on, it takes over from that wildcard route. If you use wildcard routes, check that this is fine for your site.

When the script refuses to reboot, it writes the reason to its log. It also sends an alert, if you have set one up.

## The page itself

This is the Cloudflare Worker. It knows no hostnames, so all servers in one Cloudflare account can share it:

```js
const PAGES = {
  nl: {
    title: 'Even geduld',
    text: 'Deze server moet helaas even opnieuw opstarten voor een beveiligingsupdate. Over een paar minuten is de site weer beschikbaar.'
  },
  en: {
    title: 'Back in a few minutes',
    text: 'Unfortunately, this server needs to restart for a security update. The site will be available again in a few minutes.'
  }
};

function pickLanguage(request) {
  const header = request.headers.get('accept-language') || '';
  const wanted = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? parseFloat(q.slice(2)) : 1 };
    })
    .filter((entry) => Object.hasOwn(PAGES, entry.lang) && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return wanted.length ? wanted[0].lang : 'en';
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
      'content-type': 'text/html; charset=utf-8',
      'content-language': lang,
      'retry-after': '300',
      'cache-control': 'no-store',
      vary: 'accept-language'
    }
  });
}

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
    if (request.method === 'GET' || request.method === 'HEAD') {
      const response = await fromCacheOrServer(request);
      if (response) return response;
    }
    return maintenance(pickLanguage(request));
  }
};
```

The Bunny.net version is the same page with a different wrapper. It uses the `onOriginRequest` hook, which Bunny [only calls on a cache miss](https://bunny.net/docs/edge-scripting-middleware). A middleware script sits on the whole pull zone, so it has to let other hostnames through. It also lets `/.well-known/` through, so certificate renewals keep working:

```js
BunnySDK.net.http.servePullZone().onOriginRequest(async (ctx) => {
  const url = new URL(ctx.request.url);
  const ours = requestedHosts(ctx.request).some((host) => HOSTNAMES.includes(host));
  if (!ours || url.pathname.startsWith('/.well-known/')) return ctx.request;
  return maintenance(pickLanguage(ctx.request));
});
```

`requestedHosts` is a small helper in the script. It reads the hostname the visitor asked for from the request URL and from the host headers Bunny adds.

You don't install either of these by hand. The update script writes and uploads them itself.

## Setting it up

There is one script per system:

- [`debian-update.sh`](/downloads/reboot-maintenance-page/debian-update.sh) for Debian, Ubuntu and anything else that updates with `apt`.
- [`almalinux-update.sh`](/downloads/reboot-maintenance-page/almalinux-update.sh) for AlmaLinux. The CDN part is the same, the update and reboot checks use `dnf`.

Do you run another distro? Feed one of these scripts to your coding agent and have it alter the script for your setup. Only the update and reboot checks need to change.

Per site you need a few things from your CDN:

- For Cloudflare: the account ID, the zone ID, and an API token with `Account > Workers Scripts > Edit` and `Zone > Workers Routes > Edit`.
- For Bunny.net: the pull zone ID and the account API key.

Be aware that the Bunny.net key has full access to your Bunny account, and it will live in a file on your server. The script makes that file readable for root only. Decide for yourself whether you are comfortable with that.

Does your server also run `unattended-upgrades` or `dnf-automatic`? Then check that those are not set to reboot on their own. Neither does that by default, but a reboot they start would skip the page.

The steps below use the Debian names. On AlmaLinux, replace `debian-update` with `almalinux-update` everywhere.

### Install the script

Copy the script to the server and run the installer:

```bash
scp debian-update.sh <host>:~/
ssh -t <host> 'sudo bash ~/debian-update.sh --install'
```

The first run installs `curl` and `jq` if they are missing, plus `needrestart` on Debian and Ubuntu. It creates the config file, copies the script to `/usr/local/sbin/` and enables the systemd service. For a server without a maintenance page, you can skip ahead to the cron job.

### Add your sites

Fill in `/etc/debian-update/sites.conf`, one site per line:

```text
# Cloudflare: hostname|account_id|zone_id|api_token
www.example.nl|ACCOUNT_ID|ZONE_ID|API_TOKEN
# Bunny.net: hostname|bunny|pull_zone_id|api_key
www.example.com|bunny|PULL_ZONE_ID|API_KEY
```

Then run the installer again. It uploads the Worker to Cloudflare and publishes the Edge Script to Bunny.net. Run it again every time you add a Bunny.net site, or a site in a Cloudflare account the script has not seen yet. A new site in a Cloudflare account that already has the Worker only needs its line in `sites.conf`.

### Test the page

Test the page before the first real reboot. Turn it on, look at it, and turn it off straight away:

```bash
ssh -t <host> 'sudo /usr/local/sbin/debian-update.sh --page-on'
ssh -t <host> 'sudo /usr/local/sbin/debian-update.sh --page-off'
```

What you see while the page is on depends on the CDN:

- On Cloudflare, your site keeps working, because the server is up. Send a `POST` to see the page: `curl -si -X POST https://www.example.nl/` should show a `503`.
- On Bunny.net, open a URL that is not in the cache. It shows the 503, also for your visitors, so keep this test short.

### Add the cron job

Add the job to root's crontab, to run every five minutes. The `flock` makes sure a run never starts while the previous one is still busy:

```text
*/5 * * * * /usr/bin/flock -n /run/debian-update.lock /usr/local/sbin/debian-update.sh >> /var/log/debian-update.log 2>&1
```

The log is in `/var/log/debian-update.log`. After a reboot, `journalctl -u debian-update-page-off` shows whether the page was removed.

## Alerts when a run fails

A run fails when the updater returns an error, like a repository that cannot be reached or a package conflict. It also fails when the reboot check gives no clear answer, or when the page cannot be set or removed. The script then stops, does not reboot and writes the reason to the log.

To hear about that, give the script a webhook URL, for example a Slack incoming webhook. Put the URL on its own line in `/etc/debian-update/alert-url` and send a test message:

```bash
ssh -t <host> 'sudo /usr/local/sbin/debian-update.sh --alert-test'
```

The message names the server, the exit code and the last lines of output. While a failure lasts you get one alert per 24 hours, not one per run. After a successful run, the next failure alerts straight away.

## How well tested this is

Both scripts run on a few of our own servers, but they are young, and you should know exactly how far the testing goes:

- `debian-update.sh` runs with the page on Ubuntu 24.04 and 26.04, and it has been through a few real reboots there.
- `almalinux-update.sh` runs on AlmaLinux 8, without the page. The page part of that script was only tested with stubbed `dnf`, Cloudflare and `systemd` calls.
- Serving cached pages while the page is on is the newest bit, on both CDNs. It's not had a lot of testing yet.

So read the script before you run it, and do the page test above before you trust it with a reboot. Adapt it to your own setup as needed. If you improve it, I would love to hear about it.
