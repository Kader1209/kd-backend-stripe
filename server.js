require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

const rawPort = process.env.PORT;
const PORT = Number.parseInt(String(rawPort != null && String(rawPort).trim() !== "" ? rawPort : "4242"), 10);
if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
  console.error("PORT invalide:", rawPort);
  process.exit(1);
}

const HOST = process.env.HOST || "0.0.0.0";

let stripe = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (typeof stripeSecretKey === "string" && stripeSecretKey.trim().startsWith("sk_")) {
  try {
    stripe = new Stripe(stripeSecretKey.trim());
  } catch (err) {
    console.error("Stripe init:", err?.message || err);
  }
} else {
  console.warn("STRIPE_SECRET_KEY absente ou invalide — la route paiement renverra une erreur tant que la clé n'est pas définie dans Railway.");
}

app.use(
  cors({
    origin: true,
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.status(200).type("text/plain").send("Backend KD Stripe OK");
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

const server = app.listen(PORT, HOST, () => {
  console.log(`Listening on ${HOST}:${PORT}`);
});

server.on("error", (err) => {
  console.error("Listen error:", err?.message || err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err?.message || err);
});
