import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

// Helper function to extract a text value from an XML string
function extractXmlTag(xml: string, tag: string): string {
  // Try simple text content first: <Tag>value</Tag>
  const simpleMatch = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  if (simpleMatch && simpleMatch[1].trim()) return simpleMatch[1].trim();

  // Try CurrentTextValue sub-element: <EngineSize><CurrentTextValue>1969</CurrentTextValue></EngineSize>
  const blockMatch = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<CurrentTextValue[^>]*>([^<]+)<\\/CurrentTextValue>[\\s\\S]*?<\\/${tag}>`, 'i'));
  if (blockMatch && blockMatch[1].trim()) return blockMatch[1].trim();

  return '';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Validate params
    const plate = req.query.vin || req.body?.vin;
    const paymentIntentId = req.query.payment_intent_id || req.body?.payment_intent_id;

    if (!plate) return res.status(400).json({ error: 'Matrícula obrigatória' });
    if (!paymentIntentId) return res.status(402).json({ error: 'Pagamento não encontrado' });

    // 2. Validate Stripe payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Pagamento não validado pela Stripe.' });
    }

    // 3. Get RegCheck username from environment
    const regcheckUsername = process.env.REGCHECK_USERNAME || 'Antoine59';

    // 4. Call RegCheck API for Portugal
    const url = `http://www.regcheck.org.uk/api/reg.asmx/CheckPortugal?RegistrationNumber=${encodeURIComponent(plate)}&username=${encodeURIComponent(regcheckUsername)}`;
    
    console.log(`Calling RegCheck for plate: ${plate}`);
    
    const apiRes = await fetch(url, {
      headers: { 'Accept': 'text/xml, application/xml' }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('RegCheck error:', errText.slice(0, 200));
      throw new Error(`RegCheck falhou (${apiRes.status})`);
    }

    const xmlText = await apiRes.text();
    console.log('RegCheck raw XML:', xmlText.slice(0, 800));

    // 5. Try to parse vehicleJson first (richest data)
    let make = '', model = '', year = '', fuelType = '', engineCc = '', co2 = '';

    const jsonMatch = xmlText.match(/<vehicleJson>([^<]+)<\/vehicleJson>/i);
    if (jsonMatch) {
      try {
        const decoded = jsonMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        const vJson = JSON.parse(decoded);
        console.log('vehicleJson parsed:', JSON.stringify(vJson).slice(0, 500));

        make = vJson?.CarMake?.CurrentTextValue || vJson?.CarMake || vJson?.Make || '';
        model = vJson?.CarModel || vJson?.Model || vJson?.ModelDescription || '';
        year = vJson?.RegistrationYear || vJson?.ManufactureYearFrom || '';
        fuelType = vJson?.FuelType?.CurrentTextValue || vJson?.FuelType || '';
        
        // Engine size - may come like "1969" or "1.9" (liters) or "1969cc"
        const rawEngine = vJson?.EngineSize?.CurrentTextValue || vJson?.EngineSize || '';
        engineCc = parseEngineSize(rawEngine);
        
        co2 = vJson?.CO2Emissions?.CurrentTextValue || vJson?.CO2Emissions || 
              vJson?.Co2Emissions || vJson?.co2_emissions || '';
      } catch (e) {
        console.warn('Failed to parse vehicleJson:', e);
      }
    }

    // 6. Fall back to XML tags if JSON parsing didn't get all fields
    if (!make) make = extractXmlTag(xmlText, 'MakeDescription') || extractXmlTag(xmlText, 'CarMake');
    if (!model) model = extractXmlTag(xmlText, 'ModelDescription') || extractXmlTag(xmlText, 'CarModel');
    if (!year) year = extractXmlTag(xmlText, 'RegistrationYear') || extractXmlTag(xmlText, 'ManufactureYearFrom');
    if (!fuelType) fuelType = extractXmlTag(xmlText, 'FuelType');
    if (!engineCc) {
      const rawEngXml = extractXmlTag(xmlText, 'EngineSize');
      engineCc = parseEngineSize(rawEngXml);
    }
    if (!co2) co2 = extractXmlTag(xmlText, 'CO2Emissions') || extractXmlTag(xmlText, 'Co2Emissions');

    // Map fuel type to Portuguese
    fuelType = mapFuelType(fuelType);

    console.log(`Result: make=${make}, model=${model}, year=${year}, fuelType=${fuelType}, engineCc=${engineCc}, co2=${co2}`);

    if (!make && !model) {
      throw new Error('Veículo não encontrado no RegCheck. Verifique a matrícula.');
    }

    return res.status(200).json({
      make,
      model,
      year,
      fuel_type: fuelType,
      engine_cc: engineCc,
      co2
    });

  } catch (error: any) {
    console.error('RegCheck proxy error:', error);
    return res.status(500).json({ error: 'Falha ao pesquisar o veículo', details: error.message });
  }
}

// Parse engine size which can come as "1969", "1969cc", "1.9", "2.0L", etc.
function parseEngineSize(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  // If it looks like liters (< 20), convert to cc
  if (num < 20) return Math.round(num * 1000).toString();
  return Math.round(num).toString();
}

// Map fuel type in English to Portuguese
function mapFuelType(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'Gasolina';
  if (lower.includes('diesel') || lower.includes('gazóleo') || lower.includes('gasoleo')) return 'Gasóleo';
  if (lower.includes('electric') || lower.includes('eléctrico') || lower.includes('eletrico')) return 'Elétrico';
  if (lower.includes('plug') || lower.includes('phev')) return 'Híbrido Plug-in';
  if (lower.includes('hybrid') || lower.includes('híbrido') || lower.includes('hibrido')) return 'Híbrido';
  if (lower.includes('petrol') || lower.includes('gasolina') || lower.includes('essence') || lower.includes('gasoline')) return 'Gasolina';
  return raw || 'Gasolina';
}
