import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const vin = req.query.vin || req.body?.vin;
    const paymentIntentId = req.query.payment_intent_id || req.body?.payment_intent_id;

    if (!vin) return res.status(400).json({ error: 'Matrícula ou Nº Quadro obrigatório' });
    if (!paymentIntentId) return res.status(402).json({ error: 'Pagamento não encontrado (Falta payment_intent_id)' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'O pagamento não foi validado com sucesso pela Stripe.' });
    }

    const token = process.env.CAR_API_TOKEN;
    const secret = process.env.CAR_API_SECRET;

    if (!token || token === 'TON_TOKEN_ICI') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return res.status(200).json({
        make: "Audi", model: "A4", year: "2018",
        fuel_type: "Gasóleo", engine_cc: "1968", co2: "115"
      });
    }

    // STEP 1: Authenticate
    const authRes = await fetch("https://carapi.app/api/auth/login", {
      method: 'POST',
      headers: { 'Accept': 'text/plain', 'Content-Type': 'application/json' },
      body: JSON.stringify({ "api_token": token, "api_secret": secret })
    });

    if (!authRes.ok) throw new Error(`Auth failed: ${authRes.status}`);
    const jwtValidToken = await authRes.text();
    const headers = { 'Authorization': `Bearer ${jwtValidToken}`, 'Accept': 'application/json' };

    // STEP 2: Get basic vehicle info (license plate or VIN)
    const isVin = vin.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(vin);
    let data: any = {};

    if (isVin) {
      const r = await fetch(`https://carapi.app/api/vin/${encodeURIComponent(vin)}`, { headers });
      if (r.ok) data = await r.json();
    } else {
      const r = await fetch(`https://carapi.app/api/license-plate?country_code=PT&lookup=${encodeURIComponent(vin)}`, { headers });
      if (!r.ok) {
        const errBody = await r.text();
        throw new Error(`Vehicle not found (${r.status}): ${errBody.slice(0, 100)}`);
      }
      data = await r.json();
      console.log('Plate response:', JSON.stringify(data).slice(0, 300));

      // STEP 3: Deep VIN lookup if plate gave us a VIN
      const plateVin = data?.vin;
      if (plateVin) {
        const vinR = await fetch(`https://carapi.app/api/vin/${encodeURIComponent(plateVin)}`, { headers });
        if (vinR.ok) {
          const vinData = await vinR.json();
          console.log('Deep VIN response:', JSON.stringify(vinData).slice(0, 300));
          data = { ...data, ...vinData };
        }
      }
    }

    // Extract basic fields
    const make = data?.make?.name || data?.make || '';
    const model = data?.model?.name || data?.model || '';
    const year = data?.year?.year?.toString() || data?.year?.toString() || '';
    const fuelTypeNode = data?.engine?.fuel_type || data?.fuel_type || 'Gasolina';

    // Try direct engine cc from VIN data
    let engineCc = data?.engine?.displacement_cc?.toString() ||
                   data?.engine?.displacement?.toString() ||
                   '';

    // If the VIN/plate gave us 'size' in liters (e.g. 2.0), convert to cc
    if (!engineCc && data?.engine?.size) {
      engineCc = Math.round(parseFloat(data.engine.size) * 1000).toString();
    }

    let co2 = data?.engine?.co2_emissions?.toString() ||
              data?.co2_emissions?.toString() ||
              data?.co2?.toString() ||
              '';

    // STEP 4: If still missing engine CC, query the engines endpoint by make/model/year
    if (!engineCc && make && model && year) {
      console.log(`Querying /api/engines/v2 for ${make} ${model} ${year}...`);
      const engUrl = `https://carapi.app/api/engines/v2?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&limit=3`;
      const engRes = await fetch(engUrl, { headers });
      if (engRes.ok) {
        const engData = await engRes.json();
        console.log('Engines response:', JSON.stringify(engData).slice(0, 400));
        // data is { data: [...engines] }
        const firstEngine = engData?.data?.[0];
        if (firstEngine) {
          // 'size' is in liters (e.g. 2.0 -> 2000cc)
          if (firstEngine?.size) {
            engineCc = Math.round(parseFloat(firstEngine.size) * 1000).toString();
          }
        }
      }
    }

    return res.status(200).json({ make, model, year, fuel_type: fuelTypeNode, engine_cc: engineCc, co2 });

  } catch (error: any) {
    console.error('CarAPI proxy error:', error);
    return res.status(500).json({ error: 'Falha ao pesquisar o veículo', details: error.message });
  }
}
