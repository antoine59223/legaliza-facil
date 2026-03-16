import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vin, productId } = req.body;
    
    // Determine the product price dynamically
    let amount = 299; // 2.99 EUR base
    let description = 'Tratamento (Legaliza Fácil)';
    
    if (productId === 'autofill') {
      amount = 299;
      description = 'Auto-Fill Premium de Matrícula/VIN (Legaliza Fácil)';
    } else if (productId === 'pdf') {
       amount = 599;
       description = 'Relatório Oficial PDF (Legaliza Fácil)';
    } else if (productId === 'fullpack') {
       amount = 749;
       description = 'Pack Completo: Auto-Fill + PDF (Legaliza Fácil)';
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: { vin, productId },
      automatic_payment_methods: {
        enabled: true,
      },
      description,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
}
