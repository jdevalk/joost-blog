export async function onRequestOptions() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}

export async function onRequestPost(context) {
	const { request, env } = context;

	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	};

	try {
		const formData = await request.formData();

		// Honeypot check — bots fill hidden fields
		const honeypot = formData.get('website') || formData.get('_gotcha');
		if (honeypot) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: corsHeaders,
			});
		}

		// Timing check — humans take >3s to fill a form
		const timestamp = parseInt(formData.get('_timestamp'), 10);
		if (timestamp && Date.now() - timestamp < 3000) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: corsHeaders,
			});
		}

		const name = (formData.get('name') || '').toString().trim();
		const email = (formData.get('email') || '').toString().trim();
		const subject = (formData.get('subject') || '').toString().trim();
		const message = (formData.get('message') || '').toString().trim();

		// Server-side validation
		if (!name || !email || !message) {
			return new Response(JSON.stringify({ error: 'Please fill in all required fields.' }), {
				status: 400,
				headers: corsHeaders,
			});
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
				status: 400,
				headers: corsHeaders,
			});
		}

		if (name.length > 200 || email.length > 320 || subject.length > 500 || message.length > 10000) {
			return new Response(JSON.stringify({ error: 'One or more fields exceed the maximum length.' }), {
				status: 400,
				headers: corsHeaders,
			});
		}

		// Optional rate limiting via KV
		if (env.RATE_LIMIT) {
			const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
			const key = `rate:${ip}`;
			const existing = await env.RATE_LIMIT.get(key);
			if (existing && parseInt(existing, 10) >= 5) {
				return new Response(JSON.stringify({ error: 'Too many messages. Please try again later.' }), {
					status: 429,
					headers: corsHeaders,
				});
			}
			const count = existing ? parseInt(existing, 10) + 1 : 1;
			await env.RATE_LIMIT.put(key, count.toString(), { expirationTtl: 3600 });
		}

		// Send email via the Cloudflare Email Service REST API. Pages Functions
		// have no `send_email` binding, so this goes over HTTPS with a token
		// that only has the Email Sending permission. Sends to a verified
		// destination address (RECIPIENT_EMAIL) are free on every plan.
		const accountId = env.CF_ACCOUNT_ID;
		const apiToken = env.CF_EMAIL_TOKEN;
		const fromEmail = env.CONTACT_FROM_EMAIL;
		const recipientEmail = env.RECIPIENT_EMAIL;
		const turnstileSecret = env.TURNSTILE_SECRET_KEY;

		if (!accountId || !apiToken || !fromEmail || !recipientEmail || !turnstileSecret) {
			console.error('Missing email configuration environment variables');
			return new Response(JSON.stringify({ error: 'Contact form is not configured. Please try another contact method.' }), {
				status: 500,
				headers: corsHeaders,
			});
		}

		// Check the Turnstile token from the form with Cloudflare. This has to
		// happen here, on the server: a bot can post to this endpoint without
		// ever loading the form. A token is valid once, for five minutes.
		const turnstileToken = (formData.get('cf-turnstile-response') || '').toString();
		const turnstileResult = turnstileToken
			? await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						secret: turnstileSecret,
						response: turnstileToken,
						remoteip: request.headers.get('CF-Connecting-IP') || undefined,
					}),
				})
					.then((r) => r.json())
					.catch(() => null)
			: null;

		if (!turnstileResult?.success) {
			console.error('Turnstile check failed:', JSON.stringify(turnstileResult?.['error-codes'] ?? 'no token'));
			return new Response(JSON.stringify({ error: 'The spam check failed. Please reload the page and try again.' }), {
				status: 400,
				headers: corsHeaders,
			});
		}

		const emailSubject = `joost.blog contact: ${subject || 'No subject'}`;
		const emailBody = `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'No subject'}\n\nMessage:\n${message}`;

		const emailResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiToken}`,
			},
			body: JSON.stringify({
				from: { address: fromEmail, name: 'joost.blog contact form' },
				to: recipientEmail,
				reply_to: email,
				subject: emailSubject,
				text: emailBody,
			}),
		});

		// The API answers 200 with `success: true` even when the recipient
		// bounced, so the per-recipient result has to be checked as well.
		const emailResult = await emailResponse.json().catch(() => null);
		const accepted = [...(emailResult?.result?.delivered ?? []), ...(emailResult?.result?.queued ?? [])];

		if (!emailResponse.ok || !emailResult?.success || accepted.length === 0) {
			console.error('Cloudflare Email Service error:', emailResponse.status, JSON.stringify(emailResult));
			return new Response(JSON.stringify({ error: 'Failed to send message. Please try again later.' }), {
				status: 500,
				headers: corsHeaders,
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: corsHeaders,
		});
	} catch (err) {
		console.error('Contact form error:', err);
		return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }), {
			status: 500,
			headers: corsHeaders,
		});
	}
}
