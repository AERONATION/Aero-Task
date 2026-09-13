import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

function resendDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'resend-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { to, subject, html, text, from } = JSON.parse(body || '{}');
              const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
              const fromEmail = from || env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@unifiedcampusgrid.online';

              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'RESEND_API_KEY not configured in .env' }));
                return;
              }

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
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Error processing email dispatch' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), resendDevPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
