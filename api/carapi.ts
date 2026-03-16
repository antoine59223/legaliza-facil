export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for proxy, adjust in prod
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { vin } = req.query;

    if (!vin) {
      return res.status(400).json({ error: 'VIN or License Plate is required' });
    }

    // Since we don't have the user's API key yet, we mock a successful API response for demonstration purposes.
    // In production, this would be a fetch() call to carapi.app using process.env.CARAPI_KEY
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock Response from CarAPI (or similar provider)
    const mockResponse = {
      make: "Audi",
      model: "A4",
      year: "2018",
      fuel_type: "Gasóleo",
      engine_cc: "1968",
      co2: "115"
    };

    return res.status(200).json(mockResponse);

  } catch (error) {
    console.error('CarAPI proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch vehicle data', details: error.message });
  }
}
