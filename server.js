import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// ⚠️ Mettez votre CLÉ SECRÈTE ici (sk_test_...)
const stripe = new Stripe('sk_test_51Sp4kbPpfbp0KU2Mrb7Vi58ht8hquM8pvlr902U9StnpG0UNXvJ1Fvo4DMxNc0ULKu0FvSzPcReZcqwXYkXv6wjT009KobPQVe'); 

const app = express();

// Autoriser tout le monde (évite les erreurs de blocage en développement)
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Création de l'intention de paiement chez Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe compte en centimes !
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
    });

    // On renvoie le secret au Frontend
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.listen(8080, () => console.log('✅ Backend lancé sur le port 8080'));