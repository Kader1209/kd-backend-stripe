require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const PORT = Number.parseInt(process.env.PORT || "4242", 10);
const HOST = process.env.HOST || "0.0.0.0";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("Backend KD Stripe OK");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, stripe: Boolean(stripe) });
});

app.post("/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error:
        "Configuration serveur manquante: STRIPE_SECRET_KEY n'est pas definie.",
    });
  }

  try {
    const { amount, description } = req.body || {};
    const unitAmount = Math.round(Number(amount) * 100);

    if (!Number.isFinite(unitAmount) || unitAmount < 100) {
      return res.status(400).json({
        error: "Montant invalide. Le montant doit etre un nombre >= 1 EUR.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: description || "Réservation KD Conciergerie",
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
    console.error("Erreur Stripe :", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Serveur lance sur ${HOST}:${PORT}`);
});
