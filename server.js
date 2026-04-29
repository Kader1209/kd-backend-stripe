require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend KD Stripe OK");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Réservation KD Conciergerie",
            },
            unit_amount: 25500,
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

app.listen(4242, () => {
  console.log("Serveur lancé sur http://localhost:4242");
});


