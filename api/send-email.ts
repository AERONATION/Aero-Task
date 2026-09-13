// Vercel Serverless Function for sending emails via Resend

export default async function handler(req: any, res: any) {
  // Allow CORS for local dev / cross-origin if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    const { to, subject, html, text, from } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Missing required email fields (to, subject, html/text)' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is missing.');
      return res.status(500).json({ error: 'Resend API key is not configured on server.' });
    }

    const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'noreply@unifiedcampusgrid.online';
    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail.includes('<') ? fromEmail : `AeroTask <${fromEmail}>`,
        to: recipients,
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API returned error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to dispatch email via Resend' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Email serverless handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while sending email' });
  }
}
