import 'dotenv/config'; // Charge les variables d'environnement
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// ⚠️ REMPLACE PAR TA VRAIE CLÉ SECRÈTE STRIPE (commence par sk_test_...)
const stripe = new Stripe('sk_test_51Sp4kbPpfbp0KU2Mrb7Vi58ht8hquM8pvlr902U9StnpG0UNXvJ1Fvo4DMxNc0ULKu0FvSzPcReZcqwXYkXv6wjT009KobPQVe'); 

const app = express();

app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Conversion en centimes
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
});

app.listen(8080, () => console.log('✅ Serveur Node démarré sur le port 8080'));