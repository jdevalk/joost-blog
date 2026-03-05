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

		// Send email via Lettermint API
		const apiKey = env.LETTERMINT_API_KEY;
		const fromEmail = env.FROM_EMAIL;
		const recipientEmail = env.RECIPIENT_EMAIL;

		if (!apiKey || !fromEmail || !recipientEmail) {
			console.error('Missing email configuration environment variables');
			return new Response(JSON.stringify({ error: 'Contact form is not configured. Please try another contact method.' }), {
				status: 500,
				headers: corsHeaders,
			});
		}

		const emailSubject = `joost.blog contact: ${subject || 'No subject'}`;
		const emailBody = `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'No subject'}\n\nMessage:\n${message}`;

		const emailResponse = await fetch('https://api.lettermint.co/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				from: fromEmail,
				to: recipientEmail,
				subject: emailSubject,
				text: emailBody,
				replyTo: email,
			}),
		});

		if (!emailResponse.ok) {
			const errorText = await emailResponse.text();
			console.error('Lettermint API error:', emailResponse.status, errorText);
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
