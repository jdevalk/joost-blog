---
title: A <em>contact form</em> for your Astro site, without an email provider
seo:
  title: An Astro contact form with Cloudflare Email Service
  description: >-
    Cloudflare sends email to your own verified address for free. Here is how I
    use that for the contact form on my static Astro site.
  pageType: article
publishDate: 2026-11-25T00:00:00.000Z
excerpt: >-
  A contact form on a static site needs something that sends the email.
  Cloudflare now does that for free when the email goes to your own verified
  address. This is how I set it up for this site, with the code.
categories:
  - Development
toc: false
---

A static site cannot send email. So a contact form on an Astro site always needs a second thing: a form service, or an email API with an account, an API key and a monthly limit. That is a lot of setup for a form that sends a few messages a week, all of them to you.

Cloudflare's Email Service takes that second thing away. Today, Cloudflare announced that [Email Sending is now available on the Workers Free plan](https://developers.cloudflare.com/changelog/post/2026-11-24-email-sending-workers-free/). Sending to a verified destination address in your own account is free on all plans, and those emails do not count toward any quota. A contact form is exactly that: every email goes to you.

So today I moved the [contact form](/contact-me/) on this site to it. This post shows how, with the code.

## What you need

This setup is for a static Astro site on Cloudflare Pages, with its DNS at Cloudflare. It has three parts:

- A form on your Astro page.
- A Pages Function that receives the form and asks Cloudflare to send the email.
- Four things on the Cloudflare side: a verified address to send to, a domain to send from, an API token, and a Turnstile widget to keep spam out.

Your site stays static. A file in a `functions` folder in the root of your project becomes an endpoint on Cloudflare Pages, so you don't need an adapter or server-side rendering in Astro.

## Why the REST API and not the binding

Workers can send email through a `send_email` binding, with no API token at all. Pages Functions cannot. Cloudflare's own [comparison of Workers and Pages](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) lists that binding as not supported on Pages.

So the function calls the [REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/) with `fetch` and a token. If your site runs on Workers, use the binding instead and skip the token.

## The Cloudflare side

<div class="sp-callout">
<div class="lbl">Too much config work?</div>
<p>If you think this is a lot of config work: this is why my agent has access to the <a href="https://developers.cloudflare.com/cf/"><code>cf</code> binary</a>, Cloudflare's CLI. It onboarded the subdomain, created the token, looked up the Turnstile keys and set the variables for me. Just feed it this post.</p>
</div>

### An address to send to

In the Cloudflare dashboard, go to **Compute** > **Email Service** > **Email Routing** > **Destination Addresses** and add your own email address. Cloudflare sends you an email with a link to verify it. Only email to a verified address is free.

### A domain to send from

The mail for joost.blog runs on Google Workspace. Cloudflare's Email Routing wants the MX records of the domain it runs on, so I could not turn it on for joost.blog without breaking my own mail. Instead I onboarded a subdomain, `forms.joost.blog`, under **Email Service** > **Email Sending** > **Onboard Domain**. That adds the following DNS records, and nothing else:

- MX and SPF records on `cf-bounce.forms.joost.blog`, to handle bounces.
- A DKIM key on `cf-bounce._domainkey.forms.joost.blog`.
- A DMARC record on `_dmarc.forms.joost.blog`.

The MX, SPF and DMARC records of joost.blog itself did not change. The form now sends from `contact@forms.joost.blog`.

You don't need a paid plan for this. With today's change, a free account can onboard a sending domain and send to its verified addresses. My own account is on Workers Paid, so I have not run these steps on a free account myself.

If your domain already uses Cloudflare's Email Routing for its mail, you can also send from that domain without onboarding anything. The [limits page](https://developers.cloudflare.com/email-service/platform/limits/) calls that the legacy path and recommends a sending domain instead.

### An API token

Create a custom API token under **My Profile** > **API Tokens**. Give it one permission, **Account** > **Email Sending** > **Edit**, and limit it to the one account you send from. A token like that can send email and do nothing else.

### A Turnstile widget

[Turnstile](https://developers.cloudflare.com/turnstile/) is Cloudflare's CAPTCHA alternative. Most visitors never have to click anything. In the dashboard, go to **Turnstile**, add a widget and enter the domain of your site. You get two keys: a site key, which goes in your form, and a secret key, which goes in the function.

### Variables for the function

In your Pages project, go to **Settings** > **Variables and Secrets** and add these five:

- `CF_ACCOUNT_ID`: your Cloudflare account ID.
- `CF_EMAIL_TOKEN`: the API token. Add this one as a secret.
- `CONTACT_FROM_EMAIL`: the address to send from, like `contact@forms.example.com`.
- `RECIPIENT_EMAIL`: your verified address.
- `TURNSTILE_SECRET_KEY`: the secret key of your Turnstile widget. Add this one as a secret too.

Variables only apply to new deployments, so deploy again after you add them.

## The function

Save this as `functions/api/contact.js` in the root of your project. On Cloudflare Pages, it answers `POST` requests to `/api/contact`:

```js
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();

    // Bots fill in hidden fields, and they send a form within a second or two.
    // Tell them it worked, and send nothing.
    const startedAt = parseInt(formData.get('_timestamp'), 10);
    if (formData.get('website') || (startedAt && Date.now() - startedAt < 3000)) {
      return json({ success: true });
    }

    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const subject = (formData.get('subject') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      return json({ error: 'Please fill in all required fields.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }
    if (name.length > 200 || email.length > 320 || subject.length > 500 || message.length > 10000) {
      return json({ error: 'One or more fields are too long.' }, 400);
    }

    // Ask Cloudflare whether the Turnstile token from the form is real.
    const token = (formData.get('cf-turnstile-response') || '').toString();
    const check = token
      ? await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: request.headers.get('CF-Connecting-IP') || undefined
          })
        })
          .then((r) => r.json())
          .catch(() => null)
      : null;

    if (!check?.success) {
      return json({ error: 'The spam check failed. Please reload the page and try again.' }, 400);
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.CF_EMAIL_TOKEN}`
        },
        body: JSON.stringify({
          from: { address: env.CONTACT_FROM_EMAIL, name: 'Contact form' },
          to: env.RECIPIENT_EMAIL,
          reply_to: email,
          subject: `Contact form: ${subject || 'No subject'}`,
          text: `Name: ${name}\nEmail: ${email}\n\n${message}`
        })
      }
    );

    // A bounce still comes back as a 200 with "success": true,
    // so check what happened to the recipient as well.
    const data = await response.json().catch(() => null);
    const accepted = [...(data?.result?.delivered ?? []), ...(data?.result?.queued ?? [])];

    if (!response.ok || !data?.success || accepted.length === 0) {
      console.error('Email Service error:', response.status, JSON.stringify(data));
      return json({ error: 'Failed to send message. Please try again later.' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return json({ error: 'Something went wrong. Please try again later.' }, 500);
  }
}
```

Three details in there matter more than they look:

- The visitor's address goes in `reply_to`, never in `from` or `to`. The email comes from your own domain and goes to your own address. You hit reply, and your answer goes to the visitor.
- The email is plain text. The message is typed by a stranger, so I don't put it in HTML.
- The Turnstile check happens in the function, not in the browser. A bot does not use your form. It posts straight to the endpoint, so a check in the browser stops nothing.

## The form

The form is plain HTML with a small script. This goes in any `.astro` page or component:

```astro
<form id="contact-form">
  <!-- Honeypot: people never see this field, bots fill it in. -->
  <input type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
    style="position:absolute;left:-9999px" />
  <input type="hidden" name="_timestamp" />

  <label>Name <input type="text" name="name" required /></label>
  <label>Email <input type="email" name="email" required /></label>
  <label>Subject <input type="text" name="subject" /></label>
  <label>Message <textarea name="message" rows="8" required></textarea></label>

  <!-- Turnstile adds a hidden field with its token to the form. -->
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>

  <p id="form-status" role="status" aria-live="polite"></p>
  <button type="submit">Send message</button>
</form>

<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<script>
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const startedAt = form.querySelector('[name="_timestamp"]');
  const button = form.querySelector('button');

  startedAt.value = Date.now().toString();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;

    try {
      const response = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      const result = await response.json();

      if (response.ok) {
        status.textContent = 'Message sent. I will get back to you soon.';
        form.reset();
        startedAt.value = Date.now().toString();
      } else {
        status.textContent = result.error || 'Something went wrong. Please try again.';
      }
    } catch {
      status.textContent = 'Failed to send message. Please try again later.';
    } finally {
      // A Turnstile token only works once, so ask for a new one.
      window.turnstile?.reset();
      button.disabled = false;
    }
  });
</script>
```

The `required` attributes let the browser check the fields before the form is sent. The function checks them again, for the same reason it checks the Turnstile token.

The Turnstile script has `is:inline`. That tells Astro to leave the tag alone and not process it as part of your own code.

## Keeping spam out

A contact form is an open door, so it has three checks.

The first two are cheap and run before anything else. One is a honeypot: a field that people cannot see and bots fill in. The other is a timestamp: the page stores when it loaded, and a form that comes back within three seconds was not typed by a person. In both cases the function says the message was sent and sends nothing, so a bot learns nothing from the answer.

The third is Turnstile. The widget in the form runs its check in the visitor's browser and puts a token in a hidden field, `cf-turnstile-response`. The function sends that token to Cloudflare's `siteverify` endpoint together with your secret key. Only when Cloudflare says the token is good does the email go out. A token works once and expires after five minutes, which is why the form asks for a new one after every attempt.

For local development, Cloudflare has [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) that always pass or always fail. Your real widget only works on the domains you gave it, so use the test site key on `localhost`.

## What I ran into

A few things cost me time, so here they are:

- A bounced email comes back as a 200 response with `"success": true`. The recipient is listed under `permanent_bounces` in the result. A function that only checks the status code tells your visitor the message was sent while it was not.
- The REST API and the Workers binding use different field names. The REST API wants `reply_to` and `{ address, name }`. The binding wants `replyTo` and `{ email, name }`.
- You cannot read a secret back from Pages after you save it. The only real test is to deploy and send yourself a message through the form.

## What is not free

The free part only covers email to your own verified addresses. A copy of the message to your visitor, or an automatic "thanks, I got your message" reply, goes to an address Cloudflare does not know. Those need the Workers Paid plan, which includes 3,000 emails a month. After that they cost $0.35 per 1,000.

You should not want those anyway. A form that emails whatever address a stranger types in is, in effect, an open relay: anyone can use it to send email from your domain to someone who never asked for it. That is good for spammers and bad for the reputation of your domain.

So the limit is fine. The form only has to do one thing: get the message to you.
