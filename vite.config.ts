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
                const rawPhones = data.phones || [data.phone || ''];
                const validPhones = (Array.isArray(rawPhones) ? rawPhones : [rawPhones])
                  .map(p => String(p).replace(/\D/g, '').slice(-10))
                  .filter(p => p.length === 10);

                const otp = data.otp ? String(data.otp) : undefined;
                const message = data.message ? String(data.message) : undefined;
                const apiKey = data.apiKey || env.VITE_FAST2SMS_API_KEY || env.VITE_SMS_API_KEY;

                res.setHeader('Content-Type', 'application/json');

                if (validPhones.length === 0) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, message: 'वैध १० अंकी मोबाईल नंबर सापडला नाही.' }));
                  return;
                }

                const numbersString = validPhones.join(',');

                if (!apiKey || apiKey.includes('YOUR_') || apiKey.trim() === '') {
                  // Simulated SMS delivery
                  console.log(`[Vite SMS Mock] 📱 ${otp ? 'OTP' : 'Event/Broadcast SMS'} simulated for ${validPhones.length} number(s): ${numbersString}`);
                  if (message) console.log(`[Vite SMS Mock Text]:\n${message}`);
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    simulated: true,
                    recipientCount: validPhones.length,
                    message: `${validPhones.length} मोबाईल नंबरवर SMS यशस्वीरीत्या सिम्युलेट झाला.`,
                    otp
                  }));
                  return;
                }

                // Send real SMS via Fast2SMS
                const postPayload = otp ? {
                  route: 'otp',
                  variables_values: otp,
                  numbers: numbersString
                } : {
                  route: 'q',
                  message: message || 'श्री दुर्गा मंडळ कार्यक्रम सूचना.',
                  language: 'unicode',
                  numbers: numbersString
                };

                const postData = JSON.stringify(postPayload);

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
                      const isSuccess = parsed.return === true;
                      const errorMsg = parsed.message
                        ? (Array.isArray(parsed.message) ? parsed.message.join(', ') : String(parsed.message))
                        : 'Fast2SMS प्रमाणीकरण अयशस्वी. कृपया API Key आणि वॉलेट बॅलन्स तपासा.';

                      res.statusCode = isSuccess ? 200 : 400;
                      res.end(JSON.stringify({
                        success: isSuccess,
                        message: isSuccess ? `${validPhones.length} मोबाईल नंबरवर Real SMS यशस्वीरीत्या पाठवला गेला!` : `Fast2SMS त्रुटी: ${errorMsg}`,
                        raw: parsed,
                        recipientCount: validPhones.length,
                        isRealSms: true
                      }));
                    } catch {
                      res.statusCode = 500;
                      res.end(JSON.stringify({ success: false, isRealSms: true, message: 'Fast2SMS सर्व्हरकडून प्रतिसाद वाचताना त्रुटी आली.' }));
                    }
                  });
                });

                smsReq.on('error', e => {
                  console.error('[Fast2SMS Server Error]', e);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: e.message, message: `नेटवर्क त्रुटी: ${e.message}` }));
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
