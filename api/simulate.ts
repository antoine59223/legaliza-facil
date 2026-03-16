import { calculateISV, calculateIUC } from './calculator.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const vehicleData = req.body || {};

    // Au lieu de faire un POST qui échoue car le simulateur officiel fonctionne 100% en JS Client-Side (SPA logic),
    // Nous avons extrait leur algorithme mathématique officiel et l'exécutons côté serveur (Proxy)
    // pour garantir le même résultat certifié (dont le cas de test: 1600cc / 120g = 4710.22€).

    const isv = calculateISV(vehicleData);
    const iuc = calculateIUC(vehicleData);

    // Réponse propre et formattée pour notre frontend
    res.status(200).json({
      success: true,
      data: {
        isv: isv,
        iuc: iuc
      }
    });

  } catch (error: any) {
    console.error("Erreur Vercel API:", error.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la communication ou du calcul.' });
  }
}
