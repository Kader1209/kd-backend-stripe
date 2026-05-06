require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors({
  origin: "https://kader1209.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.send("Backend KD Stripe OK");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide ou manquant" });
    }

    const unitAmount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Réservation KD Conciergerie",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: "https://kader1209.github.io/KD-Conciergerie/success.html",
      cancel_url: "https://kader1209.github.io/KD-Conciergerie/reservation.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
