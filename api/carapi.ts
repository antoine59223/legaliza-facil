import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Validate request parameters
    const vin = req.query.vin || req.body?.vin;
    const paymentIntentId = req.query.payment_intent_id || req.body?.payment_intent_id;

    if (!vin) return res.status(400).json({ error: 'Matrícula ou Nº Quadro obrigatório' });
    if (!paymentIntentId) return res.status(402).json({ error: 'Pagamento não encontrado (Falta payment_intent_id)' });

    // 2. Validate Payment Security with Stripe (Crucial step to prevent fraud)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'O pagamento não foi validado com sucesso pela Stripe.' });
    }

    // Optional: Mark this paymentIntent as used in metadata to prevent double-dipping,
    // although our frontend consumes it immediately.

    // 3. Call Actual CarAPI via Server to hide secrets
    const token = process.env.CAR_API_TOKEN;
    const secret = process.env.CAR_API_SECRET;

    if (!token || token === 'TON_TOKEN_ICI') {
      // Mock mode if user hasn't put real keys yet
      console.log('Using Mock CarAPI data because real keys are not set.');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      return res.status(200).json({
        make: "Audi", 
        model: "A4", 
        year: "2018", 
        fuel_type: "Gasóleo", 
        engine_cc: "1968", 
        co2: "115"
      });
    }

    // Real API Request to CarAPI
    // Step 1: Login to get JWT Bearer Token
    const authRes = await fetch("https://carapi.app/api/auth/login", {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "api_token": token,
        "api_secret": secret
      })
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error('CarAPI Auth Error:', errText);
      throw new Error(`Falha de autenticação na API de Veículos (Status: ${authRes.status})`);
    }

    const jwtValidToken = await authRes.text();

    // Step 2: Use the JWT to fetch the VIN or License Plate
    const headers = { 
      'Authorization': `Bearer ${jwtValidToken}`,
      'Accept': 'application/json'
    };
    
    const apiRes = await fetch(`https://carapi.app/api/vin/${encodeURIComponent(vin)}`, { headers });
    
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('CarAPI Fetch Error:', errText);
      throw new Error(`Veículo não encontrado na base de dados (Status: ${apiRes.status})`);
    }
    
    const data = await apiRes.json();
    
    // Map CarAPI response to our format
    return res.status(200).json({
      make: data?.make?.name || '',
      model: data?.model?.name || '',
      year: data?.year?.year?.toString() || '',
      fuel_type: data?.engine?.fuel_type || 'Gasolina',
      engine_cc: data?.engine?.displacement_cc?.toString() || '',
      co2: data?.engine?.co2_emissions?.toString() || ''
    });

  } catch (error: any) {
    console.error('CarAPI proxy error:', error);
    return res.status(500).json({ error: 'Falha ao pesquisar o veículo', details: error.message });
  }
}
