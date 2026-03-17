import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

// ─── Country detection from plate format ────────────────────────────────────
// Returns the best RegCheck endpoint name for a given license plate.
// Supports: FR, DE, ES, UK, BE, NL, IT, PT, CH, AT, PL, SE, and VIN fallback.
function detectCountryEndpoint(plate: string): { endpoint: string; countryLabel: string }[] {
  const p = plate.replace(/[\s\-\.]/g, '').toUpperCase();

  // VIN (17 chars, alphanumeric, no I/O/Q)
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(p)) {
    return [{ endpoint: 'CheckVin', countryLabel: 'VIN' }];
  }

  const candidates: { endpoint: string; countryLabel: string }[] = [];

  // France new: AB-123-CD (2L+3N+2L, 7 chars) — since 2009
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckFrance', countryLabel: 'France' });
  }
  // France old (pre-2009): 1-4 digits + 1-3 letters + 2-digit department (e.g. 380DHS59, 1234AB75)
  if (/^[0-9]{1,4}[A-Z]{1,3}[0-9]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckFrance', countryLabel: 'France (ancien)' });
  }
  // France old regional: department (1-3 digits) + letters + numbers e.g. 38-DH-1234
  if (/^[0-9]{2,3}[A-Z]{2,3}[0-9]{2,4}$/.test(p)) {
    candidates.push({ endpoint: 'CheckFrance', countryLabel: 'France (ancien)' });
  }

  // Germany: 1-3 letters + 1-2 letters + 1-4 digits (e.g. M-AB-1234, BER-XY-123)
  if (/^[A-ZÄÖÜ]{1,3}[A-Z]{1,2}[0-9]{1,4}[EH]?$/.test(p)) {
    candidates.push({ endpoint: 'CheckGermany', countryLabel: 'Allemagne' });
  }

  // Spain: 4 digits + 3 letters (e.g. 1234ABC) — since 2000
  if (/^[0-9]{4}[BCDFGHJKLMNPRSTUVWXYZ]{3}$/.test(p)) {
    candidates.push({ endpoint: 'CheckSpain', countryLabel: 'Espagne' });
  }

  // UK: AB12 CDE or AB12CDE (2L+2N+3L) — new format since 2001
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(p)) {
    candidates.push({ endpoint: 'Check', countryLabel: 'Royaume-Uni' });
  }
  // UK old format: A123 BCD or A123BCD
  if (/^[A-Z][0-9]{3}[A-Z]{3}$/.test(p)) {
    candidates.push({ endpoint: 'Check', countryLabel: 'Royaume-Uni' });
  }

  // Belgium: 1-ABC-234 or similar (1L+3L+3N or variations)
  if (/^[0-9][A-Z]{3}[0-9]{3}$/.test(p) || /^[A-Z]{3}[0-9]{3}$/.test(p)) {
    candidates.push({ endpoint: 'CheckBelgium', countryLabel: 'Belgique' });
  }

  // Netherlands: 2L+2N+2L or 2N+2L+2N or 2L+2N+2N etc (6-7 chars)
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(p) || /^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckNetherlands', countryLabel: 'Pays-Bas' });
  }

  // Italy: 2L+3N+2L (e.g. AB123CD)
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckItaly', countryLabel: 'Italie' });
  }

  // Portugal: 00-LL-00 or LL-00-LL or 00-00-LL
  if (
    /^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(p) ||
    /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(p) ||
    /^[0-9]{4}[A-Z]{2}$/.test(p)
  ) {
    candidates.push({ endpoint: 'CheckPortugal', countryLabel: 'Portugal' });
  }

  // Switzerland: AB 12345 (2L+5N)
  if (/^[A-Z]{2}[0-9]{5}$/.test(p) || /^[A-Z]{2}[0-9]{4}$/.test(p)) {
    candidates.push({ endpoint: 'CheckSwitzerland', countryLabel: 'Suisse' });
  }

  // Austria: letters + numbers combo (e.g. W 1234 AB)
  if (/^[A-Z]{1,6}[0-9]{1,6}[A-Z]{0,2}$/.test(p)) {
    candidates.push({ endpoint: 'CheckAustria', countryLabel: 'Autriche' });
  }

  // Default fallback: try France then UK (most common import sources for PT)
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

// ─── XML/JSON parser ─────────────────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string {
  const simpleMatch = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  if (simpleMatch && simpleMatch[1].trim()) return simpleMatch[1].trim();
  const blockMatch = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<CurrentTextValue[^>]*>([^<]+)<\\/CurrentTextValue>[\\s\\S]*?<\\/${tag}>`, 'i'));
  if (blockMatch && blockMatch[1].trim()) return blockMatch[1].trim();
  return '';
}

function parseVehicleData(xmlText: string) {
  let make = '', model = '', year = '', fuelType = '', engineCc = '', co2 = '';

  const jsonMatch = xmlText.match(/<vehicleJson>([^<]+)<\/vehicleJson>/i);
  if (jsonMatch) {
    try {
      const decoded = jsonMatch[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      const vJson = JSON.parse(decoded);
      console.log('vehicleJson parsed:', JSON.stringify(vJson).slice(0, 600));

      make = vJson?.CarMake?.CurrentTextValue || vJson?.CarMake || vJson?.Make || vJson?.MakeDescription?.CurrentTextValue || '';
      model = vJson?.CarModel?.CurrentTextValue || vJson?.CarModel || vJson?.Model || vJson?.ModelDescription?.CurrentTextValue || '';
      year = vJson?.RegistrationYear || vJson?.ManufactureYearFrom || vJson?.Year || '';
      fuelType = vJson?.FuelType?.CurrentTextValue || vJson?.FuelType || '';

      const rawEngine = vJson?.EngineSize?.CurrentTextValue || vJson?.EngineSize || vJson?.cc || '';
      engineCc = parseEngineSize(String(rawEngine));

      co2 = String(vJson?.CO2Emissions?.CurrentTextValue || vJson?.CO2Emissions ||
            vJson?.Co2Emissions || vJson?.co2_emissions || vJson?.Emissions?.CO2 || '').replace(/[^0-9.]/g, '');
    } catch (e) {
      console.warn('vehicleJson parse error:', e);
    }
  }

  // XML fallbacks
  if (!make) make = extractXmlTag(xmlText, 'MakeDescription') || extractXmlTag(xmlText, 'CarMake');
  if (!model) model = extractXmlTag(xmlText, 'ModelDescription') || extractXmlTag(xmlText, 'CarModel');
  if (!year) year = extractXmlTag(xmlText, 'RegistrationYear') || extractXmlTag(xmlText, 'ManufactureYearFrom');
  if (!fuelType) fuelType = extractXmlTag(xmlText, 'FuelType');
  if (!engineCc) engineCc = parseEngineSize(extractXmlTag(xmlText, 'EngineSize') || extractXmlTag(xmlText, 'CC'));
  if (!co2) co2 = (extractXmlTag(xmlText, 'CO2Emissions') || extractXmlTag(xmlText, 'Co2Emissions')).replace(/[^0-9.]/g, '');

  return { make, model, year, fuelType, engineCc, co2 };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const plate = (req.query.vin || req.body?.vin || '').trim().toUpperCase();
    const paymentIntentId = req.query.payment_intent_id || req.body?.payment_intent_id;

    if (!plate) return res.status(400).json({ error: 'Matrícula obrigatória' });
    if (!paymentIntentId) return res.status(402).json({ error: 'Pagamento não encontrado' });

    // Validate Stripe payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Pagamento não validado pela Stripe.' });
    }

    const regcheckUsername = process.env.REGCHECK_USERNAME || 'Antoine59';
    const countryOverride = (req.query.country || req.body?.country || '') as string;

    // Map country name to RegCheck endpoint
    const COUNTRY_ENDPOINT_MAP: Record<string, string> = {
      'France': 'CheckFrance',
      'Spain': 'CheckSpain',
      'Germany': 'CheckGermany',
      'UK': 'Check',
      'Belgium': 'CheckBelgium',
      'Netherlands': 'CheckNetherlands',
      'Italy': 'CheckItaly',
      'Portugal': 'CheckPortugal',
      'Switzerland': 'CheckSwitzerland',
      'Austria': 'CheckAustria',
      'Sweden': 'CheckSweden',
    };

    // If user manually selected a country, put it first in candidates
    let candidates = detectCountryEndpoint(plate);
    if (countryOverride && COUNTRY_ENDPOINT_MAP[countryOverride]) {
      const forcedEndpoint = { endpoint: COUNTRY_ENDPOINT_MAP[countryOverride], countryLabel: countryOverride };
      candidates = [forcedEndpoint, ...candidates.filter(c => c.endpoint !== forcedEndpoint.endpoint)];
      console.log(`Country override: ${countryOverride} → ${forcedEndpoint.endpoint}`);
    }

    console.log(`Plate: ${plate} → candidates: ${candidates.map(c => c.endpoint).join(', ')}`);

    let lastError = '';
    for (const { endpoint, countryLabel } of candidates) {
      try {
        let url: string;
        if (endpoint === 'CheckVin') {
          // VIN lookup: use UK check (most comprehensive)
          url = `http://www.regcheck.org.uk/api/reg.asmx/Check?RegistrationNumber=${encodeURIComponent(plate)}&username=${encodeURIComponent(regcheckUsername)}`;
        } else {
          url = `http://www.regcheck.org.uk/api/reg.asmx/${endpoint}?RegistrationNumber=${encodeURIComponent(plate)}&username=${encodeURIComponent(regcheckUsername)}`;
        }

        console.log(`Trying ${endpoint} for ${plate}...`);
        const apiRes = await fetch(url, { headers: { 'Accept': 'text/xml, application/xml' } });

        if (!apiRes.ok) {
          lastError = `${endpoint} HTTP ${apiRes.status}`;
          continue;
        }

        const xmlText = await apiRes.text();

        // Check for explicit error in response
        if (xmlText.includes('No vehicle found') || xmlText.includes('not found') || xmlText.includes('Error')) {
          const trimmed = xmlText.replace(/<[^>]+>/g, ' ').trim().slice(0, 100);
          lastError = `${countryLabel}: ${trimmed}`;
          console.log(`${endpoint} returned no vehicle.`);
          continue;
        }

        const { make, model, year, fuelType, engineCc, co2 } = parseVehicleData(xmlText);

        if (!make && !model) {
          lastError = `${countryLabel}: véhicule non trouvé`;
          continue;
        }

        const mappedFuel = mapFuelType(fuelType);
        console.log(`✅ Found via ${endpoint}: ${make} ${model} ${year}, fuel=${mappedFuel}, cc=${engineCc}, co2=${co2}`);

        return res.status(200).json({
          make,
          model,
          year,
          fuel_type: mappedFuel,
          engine_cc: engineCc,
          co2,
          source_country: countryLabel
        });

      } catch (err: any) {
        lastError = err.message;
        console.error(`${endpoint} error:`, err.message);
      }
    }

    // All candidates failed
    throw new Error(`Veículo não encontrado. Verifique a matrícula e o país de origem. Détail: ${lastError}`);

  } catch (error: any) {
    console.error('RegCheck proxy error:', error);
    return res.status(500).json({ error: 'Falha ao pesquisar o veículo', details: error.message });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseEngineSize(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  if (num < 20) return Math.round(num * 1000).toString();
  return Math.round(num).toString();
}

function mapFuelType(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return '';
  if (lower.includes('diesel') || lower.includes('gazole') || lower.includes('gasoil') || lower.includes('gazóleo')) return 'Gasóleo';
  if (lower.includes('electr') || lower.includes('életr') || lower.includes('elétr') || lower.includes('batterie')) return 'Elétrico';
  if (lower.includes('plug') || lower.includes('phev') || lower.includes('recharg')) return 'Híbrido Plug-in';
  if (lower.includes('hybrid') || lower.includes('híbrido') || lower.includes('hibrido')) return 'Híbrido';
  if (lower.includes('petrol') || lower.includes('essence') || lower.includes('gasolina') || lower.includes('gasoline') || lower.includes('benzine') || lower.includes('benzin')) return 'Gasolina';
  return raw;
}
