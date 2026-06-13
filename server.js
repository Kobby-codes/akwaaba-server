const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio sends form data
app.use(express.json());

// ── CONFIG (set these in Render environment variables) ──
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const CLAUDE_KEY         = process.env.CLAUDE_KEY;

// Simple in-memory conversation history per customer
const conversations = {};

// ── PRODUCTS ──
const products = [
  { name: 'Ankara Summer Maxi Dress', price: 350, sizes: ['S','M','L','XL','XXL'] },
  { name: 'Floral Print A-Line Midi',  price: 280, sizes: ['XS','S','M','L','XL'] },
  { name: 'Plain Bodycon Work Dress',   price: 220, sizes: ['S','M','L','XL','XXL'] },
  { name: 'Off-Shoulder Puff Blouse',   price: 150, sizes: ['S','M','L','XL'] },
  { name: 'Flat Slide Sandals',          price: 120, sizes: ['36-41'] },
  { name: 'Leather Crossbody Purse',     price: 250, sizes: ['One Size'] }
];

const catalogue = products
  .map(p => `- ${p.name}: ${p.price} GHS (sizes: ${p.sizes.join(', ')})`)
  .join('\n');

const SYSTEM_PROMPT = `You are Akua, a warm and friendly WhatsApp assistant for AKWAABA BOUTIQUE — Accra's go-to fashion destination.

AVAILABLE PRODUCTS:
${catalogue}

STORE INFO:
📍 Osu, Accra | 🕐 Mon–Sat, 9AM–7PM
📱 020 123 4567
🚚 Free delivery in Accra on orders above 500 GHS
📦 7-day returns with original tags
💳 MoMo, Bank Transfer, Card, Cash on Delivery

YOUR JOB:
- Help customers browse and find products
- Answer questions about sizes, colours, availability and prices
- When a customer is ready to order, confirm: product, size, colour and quantity
- Keep replies short, warm and use emojis naturally
- Always reply in the same language the customer uses

Keep every reply under 120 words.`;

// ── RECEIVE MESSAGE FROM TWILIO ──
app.post('/webhook', async (req, res) => {
  const from    = req.body.From;   // customer WhatsApp number e.g. whatsapp:+233...
  const message = req.body.Body;   // what they typed

  console.log(`Message from ${from}: ${message}`);

  // Build conversation history (keep last 10 turns)
  if (!conversations[from]) conversations[from] = [];
  conversations[from].push({ role: 'user', content: message });
  if (conversations[from].length > 10) conversations[from].shift();

  // Get Akua's reply from Claude
  const reply = await askClaude(conversations[from]);

  // Save reply to history
  conversations[from].push({ role: 'assistant', content: reply });

  // Send reply back via Twilio (TwiML format)
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Message>${reply}</Message>
    </Response>
  `);
});

// ── CLAUDE API ──
async function askClaude(history) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: history
      })
    });

    const data = await res.json();
    return data.content?.[0]?.text || "Sorry, I'm having a little trouble right now. Please try again in a moment!";
  } catch (err) {
    console.error('Claude error:', err.message);
    return "Sorry, I'm having a little trouble right now. Please try again!";
  }
}

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ AKWAABA AI is running!',
    time: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AKWAABA server running on port ${PORT}`));
