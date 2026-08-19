import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'sms-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/send-sms', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}');
                const phone = String(data.phone || '').replace(/\D/g, '').slice(-10);
                const otp = String(data.otp || '');
                const apiKey = data.apiKey || env.VITE_FAST2SMS_API_KEY || env.VITE_SMS_API_KEY;

                res.setHeader('Content-Type', 'application/json');

                if (!phone || phone.length !== 10) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, message: 'Invalid 10-digit phone number' }));
                  return;
                }

                if (!apiKey || apiKey.includes('YOUR_') || apiKey.trim() === '') {
                  // No API key configured
                  console.log(`[Vite SMS Mock] 📱 Real SMS simulated for +91${phone} (OTP: ${otp})`);
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    simulated: true,
                    message: `SMS Simulated for +91${phone}`,
                    otp
                  }));
                  return;
                }

                // Send real SMS via Fast2SMS using Node.js HTTPS
                const postData = JSON.stringify({
                  route: 'otp',
                  variables_values: otp,
                  numbers: phone
                });

                const options = {
                  hostname: 'www.fast2sms.com',
                  port: 443,
                  path: '/dev/bulkV2',
                  method: 'POST',
                  headers: {
                    'authorization': apiKey.trim(),
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                  }
                };

                const smsReq = https.request(options, smsRes => {
                  let responseData = '';
                  smsRes.on('data', d => {
                    responseData += d;
                  });
                  smsRes.on('end', () => {
                    try {
                      const parsed = JSON.parse(responseData || '{}');
                      console.log(`[Fast2SMS Server Result] ->`, parsed);
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        success: parsed.return === true || smsRes.statusCode === 200,
                        raw: parsed,
                        isRealSms: true
                      }));
                    } catch {
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, isRealSms: true }));
                    }
                  });
                });

                smsReq.on('error', e => {
                  console.error('[Fast2SMS Server Error]', e);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: e.message }));
                });

                smsReq.write(postData);
                smsReq.end();
              } catch (err: any) {
                console.error('[SMS Middleware Error]', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
              }
            });
          });
        }
      }
    ],
    server: {
      port: 3000,
      host: true
    }
  };
});
