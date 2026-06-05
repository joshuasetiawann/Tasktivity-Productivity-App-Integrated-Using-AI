<div align="center">

# ⚡ Tasktivity

### AI-Powered Personal Productivity Platform

Plan your schedule, manage your tasks, and boost your daily productivity with AI — complete with gamification, analytics, and Telegram integration.

[![Version](https://img.shields.io/badge/version-2.0.0-7c5cfc?style=flat-square)](https://github.com/joshuasetiawann/tasktivity-productivity-app-integrated-using-ai)
[![Status](https://img.shields.io/badge/status-active-22c55e?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-Proprietary-ef4444?style=flat-square)](#-license)
[![Made with](https://img.shields.io/badge/made%20with-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)](#)

[Features](#-key-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Installation](#-installation--setup) · [Usage](#-running-the-app) · [Docs](DOKUMENTASI_TASKTIVITY.md)

</div>

---

## 📖 Overview

**Tasktivity** is a personal productivity web app that blends modern task management with artificial intelligence. It helps you build daily schedules automatically, track your progress, and stay motivated through a game-like system of XP, levels, and streaks.

Built with pure **Vanilla JavaScript** (no heavy frameworks) yet featuring a modern, responsive interface fully connected to cloud services — Supabase as the database, OpenRouter for AI, and n8n + Telegram for automation and notifications.

> 💡 **Demo Mode**: The app runs fully with dummy data even when it isn't connected to Supabase, so you can try it instantly without any configuration.

---

## ✨ Key Features

| Module | Description |
|---|---|
| 📊 **Dashboard** | Daily overview: total tasks, progress, XP, streak, level, and real-time AI Insight. |
| ✅ **Task Management** | Create, filter (by priority/status), mark complete, and delete tasks with deadlines & notes. |
| 📅 **Calendar** | Interactive monthly view to browse and manage schedules per date. |
| 📈 **Analytics** | Productivity charts, task distribution, most productive hours, and weekly summary. |
| 🤖 **AI Assistant** | Productivity chat plus automatic daily-schedule generation from free-form descriptions. |
| 🎮 **Gamification** | XP system, tiered levels, daily streaks, and *level up* animations to keep you motivated. |
| 🔔 **Integrations** | Connected to Telegram (notifications) and n8n (automation engine). |
| 🎨 **Customization** | 3 themes (Dark / Light / Midnight) + 6 accent colors, saved automatically. |
| 📱 **Responsive** | Fully adaptive layout with a mobile sidebar and touch-friendly navigation. |

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JavaScript (ES5/ES6), HTML5, CSS3 |
| **Charting** | [Chart.js](https://www.chartjs.org/) `4.4.0` |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL cloud) |
| **AI Engine** | [OpenRouter](https://openrouter.ai/) — `openai/gpt-4o-mini` |
| **Automation** | [n8n](https://n8n.io/) workflow engine |
| **Notifications** | [Telegram Bot API](https://core.telegram.org/bots) |
| **Hosting** | [Vercel](https://vercel.com/) (Static Site) |
| **Fonts** | Inter & JetBrains Mono (Google Fonts) |

</div>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TASKTIVITY WEB APP                     │
│                  (Vanilla JS · Hosted on Vercel)            │
│                                                              │
│   index.html                                                 │
│   ├── config.js        → API keys & configuration            │
│   ├── api.js           → Data layer (Supabase + Demo)        │
│   ├── gamification.js  → XP / Level / Streak engine          │
│   ├── ui.js            → UI components & rendering            │
│   └── app.js           → Main application controller         │
└───────────┬───────────────────────┬──────────────────────────┘
            │                       │
            ▼                       ▼
   ┌──────────────┐        ┌─────────────────┐
   │   Supabase   │        │   OpenRouter    │
   │ (PostgreSQL) │        │   (AI / LLM)    │
   └──────────────┘        └─────────────────┘
            ▲
            │  (sync via webhook)
            ▼
   ┌──────────────────────────────────────────┐
   │              n8n Workflow                 │
   │   Telegram Bot  ⇄  Automation  ⇄  DB     │
   └──────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Tasktivity-Productivity-App-Integrated-Using-AI/
├── AI_Tasktivity/
│   ├── index.html              # Main page (SPA)
│   ├── css/
│   │   └── style.css           # Full styling + themes
│   ├── js/
│   │   ├── config.js           # ⚠️ API keys & configuration
│   │   ├── api.js              # Supabase & OpenRouter comms + Demo fallback
│   │   ├── app.js             # Core logic & controller
│   │   ├── ui.js              # UI components & rendering
│   │   └── gamification.js     # XP, streak, level system
│   └── .vercel/
│       └── project.json        # Vercel deploy config
├── AI_TASKTIFY.json            # n8n workflow (ready to import)
├── DOKUMENTASI_TASKTIVITY.md   # Full step-by-step setup guide
└── README.md
```

---

## 🚀 Installation & Setup

> For the **complete & detailed** setup guide (Supabase, OpenRouter, Telegram, n8n, Vercel), see **[DOKUMENTASI_TASKTIVITY.md](DOKUMENTASI_TASKTIVITY.md)**.

### Prerequisites

Make sure you have accounts on the following services (all offer a free tier):

- [Supabase](https://supabase.com) — database
- [OpenRouter](https://openrouter.ai) — AI (very cheap, ~$0.001/request)
- [Telegram BotFather](https://t.me/BotFather) — notification bot
- [n8n](https://n8n.io) — automation (self-host / cloud)
- [Vercel](https://vercel.com) — hosting

### Quick Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/joshuasetiawann/tasktivity-productivity-app-integrated-using-ai.git
   cd tasktivity-productivity-app-integrated-using-ai/AI_Tasktivity
   ```

2. **Set up the Supabase database** — run the SQL to create the `schedule`, `tasks`, and `chat_history` tables (see the [docs](DOKUMENTASI_TASKTIVITY.md#1-supabase-database)).

3. **Configure `js/config.js`** — fill in your credentials:
   ```javascript
   var CONFIG = {
     SUPABASE_URL : 'https://xxxx.supabase.co',
     SUPABASE_KEY : 'eyJhbGci...',            // anon/public key
     N8N_WEBHOOK  : 'https://your-n8n.com/webhook/...',
     AI_URL       : 'https://openrouter.ai/api/v1/chat/completions',
     AI_KEY       : 'sk-or-v1-...',
     AI_MODEL     : 'openai/gpt-4o-mini',
     CHAT_ID      : '12345678',               // Telegram chat ID
     // ... default gamification values don't need changing
   };
   ```

4. **Import the n8n workflow** — import `AI_TASKTIFY.json` into your n8n dashboard, then replace all placeholder keys (`YOUR_OPENROUTER_API_KEY`, `YOUR_SUPABASE_API_KEY`, etc.).

> 🔒 **Security**: Never commit a `config.js` containing real keys to a public repository. Use only the Supabase **anon key** on the frontend, never the `service_role` key.

---

## ▶️ Running the App

Because the app makes requests to cloud services, run it through a local server (don't open `index.html` directly via `file://` — it will be blocked by CORS).

**Option 1 — VS Code Live Server** *(easiest)*
```
Right-click index.html → "Open with Live Server"
```

**Option 2 — Python**
```bash
cd AI_Tasktivity
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option 3 — Node.js**
```bash
cd AI_Tasktivity
npx serve .
```

### Deploy to Production

```bash
npm install -g vercel
cd AI_Tasktivity
vercel
```
Or connect the repo to the Vercel dashboard — it will be auto-detected as a Static Site.

---

## 🎮 Gamification System

Tasktivity makes productivity feel like a game:

- **XP** — `+10` per completed task, `+15` per AI-generated schedule item, plus daily streak bonuses.
- **Level** — progressive curve: `required_XP = 100 × 1.5^(level-1)`.
- **Streak** — counts consecutive active days; the streak breaks if you skip a day.
- **Best Streak** — your longest streak record is stored permanently.

All progress is saved in `localStorage`, so it stays safe even without logging in.

---

## 🧩 `config.js` Reference

| Key | Description |
|---|---|
| `SUPABASE_URL` / `SUPABASE_KEY` | Supabase database credentials (anon key). |
| `N8N_WEBHOOK` | n8n workflow webhook URL. |
| `AI_URL` / `AI_KEY` / `AI_MODEL` | OpenRouter endpoint, API key, and model. |
| `CHAT_ID` | Telegram Chat ID for notifications. |
| `XP_TASK` · `XP_STREAK` · `XP_AI_SCHED` | XP points per action. |
| `LVL_BASE` · `LVL_MULT` | Leveling curve parameters. |

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| Data doesn't load | Check `SUPABASE_URL` & `SUPABASE_KEY`, and ensure the tables exist. |
| AI doesn't respond | Check your OpenRouter balance & `AI_KEY` (no extra spaces). |
| App in "Demo Mode" | Normal when Supabase isn't connected — the app still runs with dummy data. |
| n8n not receiving messages | Make sure the webhook is registered & the workflow is activated. |

> Full troubleshooting details are in the [documentation](DOKUMENTASI_TASKTIVITY.md#troubleshooting).

---

## 🗺 Roadmap

- [ ] Multi-user authentication (Supabase Auth)
- [ ] Move API keys server-side (Vercel Environment Variables)
- [ ] Progressive Web App (PWA) & full offline mode
- [ ] Browser push notifications
- [ ] Export productivity reports (PDF/CSV)

---

## 👤 Author

**Joshua Setiawan** — *AI Productivity · Tasktify Team*

---

## 📄 License

© 2026 **Joshua Setiawan**. All rights reserved.

Copying, distributing, or modifying this work without written permission from the owner is prohibited.

---

<div align="center">

⭐ If you find this project useful, give the repository a star!

**Tasktivity v2.0.0** — *Productivity, gamified.*

</div>
