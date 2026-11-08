exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { price, name, email, vin, packageName } = payload;

        const apiKey = process.env.EPAYVISTA_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'API Key missing on server' })
            };
        }

        const response = await fetch('https://pay.epayvista.com/api/v1/payment', {
            method: 'POST',
            headers: {
                'API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerEmail: email,
                customerID: 'VIN-' + Date.now(),
                amountInUSD: String(Number(price).toFixed(2))
            })
        });

        const data = await response.json();

        if (response.ok && data.url) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: data.url, reference_id: data.reference_id })
            };
        } else {
            console.error('ePayVista API Error:', data);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: data.message || 'Failed to create payment session' })
            };
        }
    } catch (err) {
        console.error('Server error creating payment:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};