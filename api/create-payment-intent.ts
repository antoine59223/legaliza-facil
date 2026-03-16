import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vin } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 299, // 2.99 EUR
      currency: 'eur',
      metadata: { vin },
      automatic_payment_methods: {
        enabled: true,
      },
      description: 'Pesquisa Premium de Matrícula/VIN (Legaliza Fácil)',
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
}
