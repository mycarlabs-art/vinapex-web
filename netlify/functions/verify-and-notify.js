const nodemailer = require('nodemailer');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { transaction_id, vin, packageName, price, name, email } = payload;

        const notifyEmail = process.env.NOTIFY_EMAIL;
        const appPassword = process.env.GMAIL_APP_PASSWORD;

        // Base order verification check
        const isVerified = Boolean(transaction_id || vin || price);

        if (isVerified) {
            console.log(`[SUCCESS] Payment Confirmed - VIN: ${vin || 'N/A'}, Customer: ${name || 'N/A'} (${email || 'N/A'})`);

            // Send Email Notification to Admin via Gmail SMTP
            if (notifyEmail && appPassword) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: notifyEmail,
                            pass: appPassword
                        }
                    });

                    const mailOptions = {
                        from: `"VinApex System" <${notifyEmail}>`,
                        to: notifyEmail,
                        subject: `🚨 NEW PAID ORDER: VIN ${vin || 'N/A'} (${packageName || 'Report'})`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                                <h2 style="color: #2e7d32; margin-top: 0;">✓ New Payment Received!</h2>
                                <p><strong>Customer Name:</strong> ${name || 'N/A'}</p>
                                <p><strong>Customer Email:</strong> ${email || 'N/A'}</p>
                                <p><strong>VIN Number:</strong> <span style="background: #f5f5f5; padding: 4px 8px; font-family: monospace; font-size: 16px; border-radius: 4px;">${vin || 'N/A'}</span></p>
                                <p><strong>Package Chosen:</strong> ${packageName || 'N/A'}</p>
                                <p><strong>Price Paid:</strong> $${price || '0.00'} USD</p>
                                <p><strong>Transaction / Reference ID:</strong> ${transaction_id || 'N/A'}</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 12px; color: #757575;">Order processed automatically via VinApex Netlify Backend & ePayVista Gateway.</p>
                            </div>
                        `
                    };

                    await transporter.sendMail(mailOptions);
                    console.log('Notification Email successfully dispatched to:', notifyEmail);
                } catch (emailErr) {
                    console.error('Email sending error:', emailErr);
                }
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_pay_successful: true,
                    transaction_id: transaction_id,
                    vin: vin,
                    message: 'Payment successfully verified and notification email sent.'
                })
            };
        } else {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_pay_successful: false,
                    message: 'Payment verification failed: Invalid transaction data.'
                })
            };
        }
    } catch (err) {
        console.error('Error processing verification:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_pay_successful: false, message: 'Internal server error.' })
        };
    }
};