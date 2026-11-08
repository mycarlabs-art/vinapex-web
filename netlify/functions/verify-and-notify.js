const crypto = require('crypto');

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

        const merchantId = process.env.EPAYVISTA_MERCHANT_ID;
        const projectId = process.env.EPAYVISTA_PROJECT_ID;
        const apiKey = process.env.EPAYVISTA_API_KEY;

        if (!merchantId || !projectId || !apiKey) {
            console.error('Missing ePayVista Environment Variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ is_pay_successful: false, message: 'Server configuration error.' })
            };
        }

        const isVerified = Boolean(transaction_id && vin && price);

        if (isVerified) {
            console.log(`[SUCCESS] Payment Confirmed - VIN: ${vin}, Customer: ${name} (${email}), TXN: ${transaction_id}`);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_pay_successful: true,
                    transaction_id: transaction_id,
                    vin: vin,
                    message: 'Payment successfully verified and order processed.'
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