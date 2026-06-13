const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const GROQ_KEY = process.env.GROQ_KEY;

const conversations = {};

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

app.post('/webhook', async (req, res) => {
  const from    = req.body.From;
  const message = req.body.Body;

  console.log(`Message from ${from}: ${message}`);

  if (!conversations[from]) conversations[from] = [];
  conversations[from].push({ role: 'user', content: message });
  if (conversations[from].length > 10) conversations[from].shift();

  const reply = await askGroq(conversations[from]);

  conversations[from].push({ role: 'assistant', content: reply });

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

async function askGroq(history) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
        ]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Sorry, I'm having a little trouble right now. Please try again!";
  } catch (err) {
    console.error('Groq error:', err.message);
    return "Sorry, I'm having a little trouble right now. Please try again!";
  }
}

app.get('/', (req, res) => {
  res.json({ status: '✅ AKWAABA AI is running!', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AKWAABA server running on port ${PORT}`));
