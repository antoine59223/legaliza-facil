import type { VehicleData } from '../components/Wizard';

export const fetchOfficialTaxData = async (vehicleData: VehicleData) => {
  try {
    // Appel à notre Vercel Serverless Function (Proxy) pour contourner le CORS
    // L'API s'occupe de faire le POST vers le site officiel et parser le HTML.
    const response = await fetch('/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      throw new Error(`Erreur du serveur proxy: ${response.statusText}`);
    }

    const json = await response.json();
    
    if (!json.success) {
      throw new Error(json.error || 'Erreur inconnue');
    }

    return {
      isv: json.data.isv,
      iuc: json.data.iuc
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des taxes:", error);
    throw error;
  }
};
