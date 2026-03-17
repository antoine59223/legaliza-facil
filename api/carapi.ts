import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

// ─── Country detection from plate format ────────────────────────────────────
function detectCountryEndpoint(plate: string): { endpoint: string; countryLabel: string }[] {
  const p = plate.replace(/[\s\-\.]/g, '').toUpperCase();

  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(p)) {
    return [{ endpoint: 'CheckVin', countryLabel: 'VIN' }];
  }

  const candidates: { endpoint: string; countryLabel: string }[] = [];

  // France new: AB-123-CD (2L+3N+2L, 7 chars)
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckFrance', countryLabel: 'France' });
  }
  // France old: 1-4 digits + 1-3 letters + 2-digit department (e.g. 380DHS59)
  if (/^[0-9]{1,4}[A-Z]{1,3}[0-9]{2}$/.test(p) || /^[0-9]{2,3}[A-Z]{2,3}[0-9]{2,4}$/.test(p)) {
    candidates.push({ endpoint: 'CheckFrance', countryLabel: 'France (ancien)' });
  }
  // Germany: M-AB-1234
  if (/^[A-ZÄÖÜ]{1,3}[A-Z]{1,2}[0-9]{1,4}[EH]?$/.test(p)) {
    candidates.push({ endpoint: 'CheckGermany', countryLabel: 'Allemagne' });
  }
  // Spain: 1234ABC
  if (/^[0-9]{4}[BCDFGHJKLMNPRSTUVWXYZ]{3}$/.test(p)) {
    candidates.push({ endpoint: 'CheckSpain', countryLabel: 'Espagne' });
  }
  // UK
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(p) || /^[A-Z][0-9]{3}[A-Z]{3}$/.test(p)) {
    candidates.push({ endpoint: 'Check', countryLabel: 'Royaume-Uni' });
  }
  // Belgium
  if (/^[0-9][A-Z]{3}[0-9]{3}$/.test(p) || /^[A-Z]{3}[0-9]{3}$/.test(p) || /^[0-9]-[A-Z]{3}-[0-9]{3}$/.test(p)) {
    candidates.push({ endpoint: 'CheckBelgium', countryLabel: 'Belgique' });
  }
  // Italy
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckItaly', countryLabel: 'Italie' });
  }
  // Portugal
  if (/^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(p) || /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(p) || /^[0-9]{4}[A-Z]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckPortugal', countryLabel: 'Portugal' });
  }

  if (candidates.length === 0) {
    candidates.push(
      { endpoint: 'CheckFrance', countryLabel: 'France' },
      { endpoint: 'Check', countryLabel: 'Royaume-Uni' },
      { endpoint: 'CheckSpain', countryLabel: 'Espagne' },
      { endpoint: 'CheckGermany', countryLabel: 'Allemagne' }
    );
  }

  return candidates;
}

// ─── Smart Data Extractor ───────────────────────────────────────────────────
function smartExtract(vJson: any, xmlText: string) {
  let make = vJson?.CarMake?.CurrentTextValue || vJson?.CarMake || vJson?.Make || vJson?.MakeDescription?.CurrentTextValue || '';
  let model = vJson?.CarModel?.CurrentTextValue || vJson?.CarModel || vJson?.Model || vJson?.ModelDescription?.CurrentTextValue || '';
  let year = vJson?.RegistrationYear || vJson?.ManufactureYearFrom || vJson?.Year || '';
  let fuelRaw = vJson?.FuelType?.CurrentTextValue || vJson?.FuelType || '';

  // 1. ENGINE SIZE HEURISTICS
  // Prioritize ExtendedData.EngineCC (most precise)
  let rawCc = vJson?.ExtendedData?.EngineCC || vJson?.EngineCC || vJson?.EngineSize?.CurrentTextValue || vJson?.EngineSize || vJson?.cc || '';
  let engineCc = parseEngineSizeSmart(String(rawCc));

  // 2. CO2 MULTI-LAYER LOOKUP
  let co2 = String(
    vJson?.ExtendedData?.Co2 || 
    vJson?.CO2Emissions?.CurrentTextValue || 
    vJson?.CO2Emissions ||
    vJson?.Co2Emissions || 
    vJson?.co2_emissions || 
    vJson?.Emissions?.CO2 || 
    ''
  ).replace(/[^0-9.]/g, '');

  // 3. XML FALLBACKS
  if (!make) make = extractXmlTag(xmlText, 'MakeDescription') || extractXmlTag(xmlText, 'CarMake');
  if (!model) model = extractXmlTag(xmlText, 'ModelDescription') || extractXmlTag(xmlText, 'CarModel');
  if (!year) year = extractXmlTag(xmlText, 'RegistrationYear') || extractXmlTag(xmlText, 'ManufactureYearFrom');
  if (!fuelRaw) fuelRaw = extractXmlTag(xmlText, 'FuelType');
  if (!engineCc) engineCc = parseEngineSizeSmart(extractXmlTag(xmlText, 'EngineCC') || extractXmlTag(xmlText, 'EngineSize') || extractXmlTag(xmlText, 'CC'));
  if (!co2) co2 = (extractXmlTag(xmlText, 'CO2Emissions') || extractXmlTag(xmlText, 'Co2Emissions') || extractXmlTag(xmlText, 'Co2')).replace(/[^0-9.]/g, '');

  return { 
    make: String(make).trim(), 
    model: String(model).trim(), 
    year: String(year).trim(), 
    fuel_type: mapFuelType(fuelRaw), 
    engine_cc: engineCc, 
    co2 
  };
}

function parseEngineSizeSmart(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';

  // HEURISTIC: Detection of Fiscal Power (CV) vs CC
  // If it's a small integer (e.g., 7, 10, 15) and NOT a float like 1.6
  if (num < 50 && !raw.includes('.')) {
    // This is likely fiscal power (CV), not CC. We ignore it to avoid 15000cc.
    return ''; 
  }

  // HEURISTIC: Liters to CC
  // If it's a small float (e.g., 1.6, 2.0, 3.0)
  if (num < 20) {
    return Math.round(num * 1000).toString();
  }

  // Regular CC
  return Math.round(num).toString();
}

function extractXmlTag(xml: string, tag: string): string {
  const simpleMatch = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  if (simpleMatch && simpleMatch[1].trim()) return simpleMatch[1].trim();
  const blockMatch = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<CurrentTextValue[^>]*>([^<]+)<\\/CurrentTextValue>[\\s\\S]*?<\\/${tag}>`, 'i'));
  if (blockMatch && blockMatch[1].trim()) return blockMatch[1].trim();
  return '';
}

function mapFuelType(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'Gasolina';
  if (lower.includes('diesel') || lower.includes('gazole') || lower.includes('gasoil') || lower.includes('gazóleo')) return 'Gasóleo';
  if (lower.includes('electr') || lower.includes('életr') || lower.includes('elétr') || lower.includes('batterie')) return 'Elétrico';
  if (lower.includes('plug') || lower.includes('phev') || lower.includes('recharg')) return 'Híbrido Plug-in';
  if (lower.includes('hybrid') || lower.includes('híbrido') || lower.includes('hibrido')) return 'Híbrido';
  if (lower.includes('essence') || lower.includes('petrol') || lower.includes('gasolina') || lower.includes('benzina') || lower.includes('benzin')) return 'Gasolina';
  if (lower.includes('gpl') || lower.includes('lpg')) return 'GPL';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const plate = (req.query.vin || req.body?.vin || '').trim().toUpperCase();
    const paymentIntentId = req.query.payment_intent_id || req.body?.payment_intent_id;
    const countryOverride = (req.query.country || req.body?.country || '') as string;

    if (!plate) return res.status(400).json({ error: 'Matrícula obrigatória' });
    if (!paymentIntentId) return res.status(402).json({ error: 'Pagamento não encontrado' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Pagamento não validado pela Stripe.' });
    }

    const regcheckUsername = process.env.REGCHECK_USERNAME || 'Antoine59';
    let candidates = detectCountryEndpoint(plate);

    const COUNTRY_MAP: Record<string, string> = {
      'France': 'CheckFrance', 'Spain': 'CheckSpain', 'Germany': 'CheckGermany',
      'UK': 'Check', 'Belgium': 'CheckBelgium', 'Netherlands': 'CheckNetherlands',
      'Italy': 'CheckItaly', 'Portugal': 'CheckPortugal', 'Switzerland': 'CheckSwitzerland'
    };

    if (countryOverride && COUNTRY_MAP[countryOverride]) {
      candidates = [{ endpoint: COUNTRY_MAP[countryOverride], countryLabel: countryOverride }, ...candidates];
    }

    let lastError = '';
    for (const { endpoint, countryLabel } of candidates) {
      try {
        const url = `http://www.regcheck.org.uk/api/reg.asmx/${endpoint === 'CheckVin' ? 'Check' : endpoint}?RegistrationNumber=${encodeURIComponent(plate)}&username=${encodeURIComponent(regcheckUsername)}`;
        const apiRes = await fetch(url, { headers: { 'Accept': 'text/xml, application/xml' } });
        if (!apiRes.ok) continue;

        const xmlText = await apiRes.text();
        if (xmlText.toLowerCase().includes('out of credit')) throw new Error('Conta RegCheck sem créditos.');
        if (xmlText.includes('No vehicle found') || xmlText.includes('not found')) continue;

        const jsonMatch = xmlText.match(/<vehicleJson>([^<]+)<\/vehicleJson>/i);
        let vJson = {};
        if (jsonMatch) {
          try {
            const decoded = jsonMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            vJson = JSON.parse(decoded);
          } catch (e) {}
        }

        const data = smartExtract(vJson, xmlText);
        if (!data.make && !data.model) continue;

        return res.status(200).json({ ...data, source_country: countryLabel });
      } catch (err: any) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Veículo não encontrado');
  } catch (error: any) {
    return res.status(500).json({ error: 'Falha ao pesquisar o véhicule', details: error.message });
  }
}
