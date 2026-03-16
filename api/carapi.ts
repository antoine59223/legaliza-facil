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
      console.log('VIN raw response:', JSON.stringify(data).slice(0, 500));
    } else {
      const r = await fetch(`https://carapi.app/api/license-plate?country_code=PT&lookup=${encodeURIComponent(vin)}`, { headers });
      if (!r.ok) throw new Error(`Vehicle not found (${r.status})`);
      data = await r.json();
      console.log('License plate raw response:', JSON.stringify(data).slice(0, 500));

      // If we got a VIN from the plate lookup, do a deeper VIN search
      const plateVin = data?.vin;
      if (plateVin) {
        const vinR = await fetch(`https://carapi.app/api/vin/${encodeURIComponent(plateVin)}`, { headers });
        if (vinR.ok) {
          const vinData = await vinR.json();
          console.log('Deep VIN raw response:', JSON.stringify(vinData).slice(0, 500));
          data = { ...data, ...vinData };
        }
      }
    }

    // STEP 3: Extract what we can from the data
    const make = data?.make?.name || data?.make || '';
    const model = data?.model?.name || data?.model || '';
    const year = data?.year?.year?.toString() || data?.year?.toString() || '';
    const fuelTypeNode = data?.engine?.fuel_type || data?.fuel_type || 'Gasolina';

    let engineCc = data?.engine?.displacement_cc?.toString() ||
                   data?.engine?.displacement?.toString() ||
                   data?.displacement_cc?.toString() ||
                   '';
    let co2 = data?.engine?.co2_emissions?.toString() ||
              data?.co2_emissions?.toString() ||
              data?.co2?.toString() ||
              data?.engine?.emissions?.toString() ||
              '';

    // STEP 4: If still missing specs AND we have make/model/year, try the trims endpoint
    if ((!engineCc || !co2) && make && model && year) {
      console.log(`Missing specs, trying trims lookup for ${make} ${model} ${year}...`);
      const trimsUrl = `https://carapi.app/api/trims?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&limit=1&verbose=yes`;
      const trimsRes = await fetch(trimsUrl, { headers });
      if (trimsRes.ok) {
        const trimsData = await trimsRes.json();
        console.log('Trims raw response:', JSON.stringify(trimsData).slice(0, 500));
        const firstTrim = trimsData?.data?.[0] || trimsData?.[0];
        if (firstTrim) {
          if (!engineCc) {
            engineCc = firstTrim?.make_model_trim_engine?.displacement_cc?.toString() ||
                       firstTrim?.make_model_trim_engine?.displacement?.toString() ||
                       firstTrim?.engine?.displacement_cc?.toString() ||
                       '';
          }
          if (!co2) {
            co2 = firstTrim?.make_model_trim_engine?.co2_emissions?.toString() ||
                  firstTrim?.engine?.co2_emissions?.toString() ||
                  firstTrim?.co2_emissions?.toString() ||
                  '';
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
