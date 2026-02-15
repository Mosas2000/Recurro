# Recurro — Submission Video Script

> **Target Length**: 3–4 minutes
> **Tone**: Confident, clear, professional. No filler words.
> **Recording**: Screen share + voiceover (use Loom, OBS, or QuickTime)

---

## 🚀 Part 0: Deploy to Vercel First (Pre-Recording)

### Step 1 — Push to GitHub (already done)

```bash
git push origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `Mosas2000/Recurro`
3. Framework preset will auto-detect **Next.js**
4. Add **Environment Variables** (click "Environment Variables" section):

| Key | Value |
|-----|-------|
| `STACKS_NETWORK` | `testnet` |
| `STACKS_API_URL` | `https://api.testnet.hiro.so` |
| `NEXT_PUBLIC_STACKS_NETWORK` | `testnet` |
| `NEXT_PUBLIC_STACKS_API_URL` | `https://api.testnet.hiro.so` |
| `X402_CREATOR_ADDRESS` | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM` |
| `NEXT_PUBLIC_X402_CREATOR_ADDRESS` | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM` |

5. For the facilitator URLs, use your Vercel domain:

| Key | Value |
|-----|-------|
| `X402_FACILITATOR_URL` | `https://recurro.vercel.app/api/facilitator` |
| `NEXT_PUBLIC_X402_FACILITATOR_URL` | `https://recurro.vercel.app/api/facilitator` |

> ⚠️ Replace `recurro.vercel.app` with your actual Vercel URL if it differs.

6. Click **Deploy** → wait for build to succeed ✅

### Step 3 — Verify It Works

- Visit `https://your-app.vercel.app` — landing page loads
- Visit `https://your-app.vercel.app/api/x402/status` — returns JSON
- Visit `https://your-app.vercel.app/api/facilitator/supported` — returns supported networks

### Step 4 — Get Testnet STX

Before recording, make sure your Leather/Xverse wallet has testnet STX:
- Go to [Stacks Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet)
- Request testnet tokens (takes ~1 min)

---

## 🎬 VIDEO SCRIPT

---

### SCENE 1: Hook (0:00 – 0:20)

**[Show: Recurro landing page on your Vercel URL]**

> "What if you could accept recurring payments — subscriptions, memberships, donations — directly in Bitcoin, with no payment processor, no API keys, and no middlemen?
>
> I'm [Your Name], and this is **Recurro** — a Bitcoin-native recurring payment platform built on Stacks, powered by the **x402 payment protocol**."

**[Action: Slowly scroll the landing page to show the hero section and feature cards]**

---

### SCENE 2: The Problem (0:20 – 0:40)

> "Today, accepting crypto subscriptions is painful. Existing solutions either require complex smart contracts, centralized backends, or they just don't support recurring billing at all.
>
> The x402 protocol changes this. It adds a native payment layer to HTTP itself — the same protocol the web runs on. When a server needs payment, it returns HTTP status **402 Payment Required**, the client signs a transaction, and the server verifies it — all happening at the protocol level."

**[Show: The architecture diagram from the README, or the x402 flow diagram on the /x402 page]**

---

### SCENE 3: Live Demo — Creator Flow (0:40 – 1:40)

**[Show: Navigate to `/dashboard`]**

> "Let me show you how it works. First, as a **creator**, I connect my Stacks wallet."

**[Action: Click "Connect Wallet" → Leather wallet popup → approve]**

> "Now I'm on my dashboard. I can create subscription plans with custom pricing and billing intervals."

**[Action: Click "Create Plan" → fill in:]**
- **Plan Name**: "Pro Membership"
- **Amount**: 5 STX
- **Interval**: Monthly

**[Action: Click "Create Plan" → plan card appears]**

> "Done. My plan is live. I get a shareable subscribe link that I can send to anyone."

**[Action: Click "Copy Link" on the plan card → show the toast notification]**

> "Let's also create a quick daily plan to show the flexibility."

**[Action: Create another plan — "Daily Tip" / 0.5 STX / Daily]**

> "I can see all my plans, and I'll have full transaction history right here on the dashboard."

---

### SCENE 4: Live Demo — Subscriber Flow (1:40 – 2:40)

> "Now let's switch to the **subscriber** experience."

**[Action: Open the subscribe link in a new tab — `/subscribe/ST…`]**

> "This is the public subscribe page. The subscriber sees all available plans from this creator."

**[Action: Connect a wallet (can be the same wallet for demo)]**

> "When I click Subscribe Now, the **x402 protocol** kicks in."

**[Action: Click "Subscribe Now" on the Pro Membership plan]**

> "Watch what happens behind the scenes:
> 1. The client makes a request to the subscribe endpoint
> 2. The server returns **HTTP 402** — payment required — with the exact amount and recipient address
> 3. My wallet pops up asking me to sign an STX transfer
> 4. Once I sign, the payment is broadcast to the Stacks blockchain
> 5. The server verifies the transaction and activates my subscription"

**[Action: Approve the transaction in the wallet popup → wait for the success card]**

> "There it is — subscription confirmed, with the transaction ID and a link to verify it on the Stacks Explorer."

**[Action: Click the explorer link briefly to show the on-chain transaction]**

---

### SCENE 5: x402 Interactive Demo (2:40 – 3:10)

> "For the judges, I also built an interactive x402 payments page that shows the protocol flow step-by-step."

**[Action: Navigate to `/x402`]**

> "This page lets you trigger an x402 payment in real time. You can see each step — the 402 response, the wallet signing, the on-chain settlement — all visualized with a progress stepper."

**[Action: Click "Access Premium Content" → walk through the steps briefly]**

> "Every payment goes through the real x402-stacks SDK. The server uses `withX402Paywall()` middleware to gate routes, and the client uses a shared `performX402Payment()` function. No mock data, no faked responses."

---

### SCENE 6: Technical Highlights (3:10 – 3:30)

> "Under the hood, Recurro is built with:
> - **Next.js 16** with the App Router
> - **x402-stacks SDK v2.0.1** for real HTTP 402 payment flows
> - **@stacks/connect v8** for wallet integration
> - A **recurring payment scheduler** that tracks billing cycles and finds due subscriptions
> - **Address-based authentication** — only the creator or subscriber can modify their plans
> - And a **local facilitator** that broadcasts transactions directly to the Stacks API"

**[Show: Quick flash of the codebase structure in VS Code, or the README architecture diagram]**

---

### SCENE 7: Close (3:30 – 3:50)

**[Show: Landing page again]**

> "Recurro proves that **x402 can power real subscription commerce on Stacks**. No smart contracts needed — just HTTP, STX, and the x402 protocol.
>
> The entire project is open source on GitHub. Thank you for watching."

**[Show: GitHub repo URL on screen]**

---

## 🎯 Pro Tips for Recording

1. **Browser**: Use Chrome/Brave in incognito with only the Leather extension enabled. Clean toolbar.
2. **Resolution**: Record at 1920×1080. Zoom browser to 110% so text is readable.
3. **Wallet**: Pre-load 50+ testnet STX so transactions don't fail mid-demo.
4. **Tab setup**: Pre-open these tabs before recording:
   - Tab 1: Landing page (`https://your-app.vercel.app`)
   - Tab 2: Dashboard (`/dashboard`)
   - Tab 3: Subscribe page (`/subscribe/YOUR_ADDRESS`) — open after copying link
   - Tab 4: x402 page (`/x402`)
5. **Speed**: Don't rush the wallet popup. Let it be visible for 2–3 seconds.
6. **Fallback**: If a transaction takes too long on testnet, you can cut/edit and pick up from the success state.
7. **Recording tool**: Loom (free, easy sharing link) or OBS (more control).
8. **Thumbnail**: Screenshot of the landing page hero section with the Recurro logo.

---

## 📝 DoraHacks Submission Checklist

- [ ] Deploy to Vercel and verify all pages work
- [ ] Record 3–4 minute video following this script
- [ ] Upload video to YouTube (unlisted) or Loom
- [ ] Submit on DoraHacks with:
  - **Project name**: Recurro
  - **Tagline**: Bitcoin-native recurring payments via x402 on Stacks
  - **Demo video link**: YouTube/Loom URL
  - **GitHub repo**: https://github.com/Mosas2000/Recurro
  - **Live demo**: https://your-app.vercel.app
  - **Description**: Copy from README "What is Recurro?" section
  - **Tech stack**: Next.js 16, x402-stacks SDK, @stacks/connect, TypeScript, Tailwind CSS
  - **Track**: x402 Stacks Challenge
