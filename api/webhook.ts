import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Vercel Next.js requires disabling body parsing to verify the raw signature. 
// However, since we're using raw Vercel Functions (not Next.js API routes), 
// we will parse the buffer manually.
async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    let event;

    if (webhookSecret && sig) {
      // Verify signature if secret is provided (Production)
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } else {
      // Fallback for local testing without local webhook forwarding
      event = JSON.parse(buf.toString());
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const vin = paymentIntent.metadata?.vin;
      
      console.log(`✅ [WEBHOOK] Paiement de 2.99€ validé pour la plaque/VIN : ${vin}`);
      // L'appel CarAPI sera de toute façon géré de maniere synchrone par le frontend
      // via la route /api/carapi sécurisée pour une meilleure UX (pas besoin de rafraichir).
      // Dans une appli lourde, on sauvegarderait le "credit" en bdd ici.
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
