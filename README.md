# AKWAABA WhatsApp AI — Twilio Version

## Deploy to Render (free, 5 min)

1. Push this folder to a GitHub repo
2. Go to render.com → New Web Service → connect repo
3. Add these Environment Variables in Render:
   - TWILIO_ACCOUNT_SID  → from Twilio dashboard (Account Info)
   - TWILIO_AUTH_TOKEN   → from Twilio dashboard (Account Info)  
   - CLAUDE_KEY          → your Anthropic API key
4. Click Deploy — you get a URL like: https://akwaaba-ai.onrender.com

## Connect Twilio Sandbox

1. Twilio dashboard → Messaging → Try it out → Send a WhatsApp message
2. Scroll down to "Sandbox Settings"
3. In "When a message comes in" paste:
   https://akwaaba-ai.onrender.com/webhook
4. Make sure method is set to HTTP POST
5. Click Save

## Test it

Send the join code to the sandbox number from your WhatsApp
Then text anything — Akua replies within 3 seconds!
