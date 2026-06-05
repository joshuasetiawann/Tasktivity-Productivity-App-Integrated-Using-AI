# Tasktivity — Dokumentasi Setup & Panduan Penggunaan

> Versi: 2.0.0  
> Stack: Vanilla JS + Supabase + OpenRouter AI + n8n + Telegram Bot  
> © 2026 Joshua Setiawan. All rights reserved.

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Struktur File](#struktur-file)
3. [Prerequisites](#prerequisites)
4. [Setup Step-by-Step](#setup-step-by-step)
   - [Supabase (Database)](#1-supabase-database)
   - [OpenRouter (AI)](#2-openrouter-ai)
   - [Telegram Bot](#3-telegram-bot)
   - [n8n Workflow](#4-n8n-workflow)
   - [Config File](#5-konfigurasi-config-file)
   - [Deploy ke Vercel](#6-deploy-ke-vercel)
5. [Import Workflow n8n](#import-workflow-n8n)
6. [Penggantian Key di n8n JSON](#penggantian-key-di-n8n-json)
7. [Cara Membuka & Menjalankan Lokal](#cara-membuka--menjalankan-lokal)
8. [Troubleshooting](#troubleshooting)

---

## Gambaran Umum

Tasktivity adalah web app produktivitas pribadi yang menggabungkan:

- **Supabase** → penyimpanan jadwal dan task (database PostgreSQL cloud)
- **OpenRouter** → AI untuk generate jadwal dan chat produktivitas
- **Telegram Bot** → notifikasi dan kontrol via chat (dijalankan dari n8n)
- **n8n** → automation engine yang menghubungkan semua komponen
- **Vercel** → hosting untuk web app-nya

---

## Struktur File

```
AI/
├── index.html          ← Halaman utama aplikasi
├── js/
│   ├── config.js       ← ⚠️  Semua API key & konfigurasi ada di sini
│   ├── api.js          ← Layer komunikasi ke Supabase & OpenRouter
│   ├── app.js          ← Logic utama aplikasi
│   ├── ui.js           ← Komponen UI & rendering
│   └── gamification.js ← Sistem XP, streak, level
├── css/
│   └── style.css       ← Styling lengkap
└── .vercel/
    └── project.json    ← Konfigurasi deploy Vercel
```

---

## Prerequisites

Pastikan kamu sudah punya akun di:

- [supabase.com](https://supabase.com) — gratis tier cukup
- [openrouter.ai](https://openrouter.ai) — isi saldo minimal (sangat murah)
- [t.me/BotFather](https://t.me/BotFather) — untuk buat Telegram bot
- [n8n.io](https://n8n.io) — bisa self-host atau cloud
- [vercel.com](https://vercel.com) — gratis untuk proyek personal

---

## Setup Step-by-Step

### 1. Supabase (Database)

**a. Buat Project baru di Supabase**
1. Login ke [app.supabase.com](https://app.supabase.com)
2. Klik **New Project** → isi nama, password database, pilih region terdekat
3. Tunggu ~2 menit sampai project siap

**b. Buat tabel yang dibutuhkan**

Pergi ke **SQL Editor** di sidebar, lalu jalankan query berikut satu per satu:

```sql
-- Tabel jadwal harian
CREATE TABLE schedule (
  id          BIGSERIAL PRIMARY KEY,
  task        TEXT NOT NULL,
  time        TEXT,
  date        TEXT,
  source      TEXT DEFAULT 'web',
  chat_id     TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel tasks/to-do
CREATE TABLE tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  deadline    DATE,
  priority    TEXT DEFAULT 'medium',
  status      TEXT DEFAULT 'pending',
  notes       TEXT DEFAULT '',
  chat_id     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabel riwayat chat AI (opsional)
CREATE TABLE chat_history (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     TEXT,
  role        TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**c. Ambil API credentials**
1. Pergi ke **Project Settings** → **API**
2. Salin **Project URL** → ini adalah `SUPABASE_URL`
3. Salin **anon/public key** → ini adalah `SUPABASE_KEY`

> ⚠️ Jangan gunakan `service_role` key di frontend — hanya pakai `anon` key.

**d. Setup Row Level Security (RLS) — opsional tapi disarankan**

Kalau mau data lebih aman, aktifkan RLS dan buat policy yang sesuai. Untuk prototyping bisa dimatikan dulu via **Authentication → Policies**.

---

### 2. OpenRouter (AI)

1. Login ke [openrouter.ai](https://openrouter.ai)
2. Pergi ke **Keys** → **Create Key**
3. Beri nama key-nya (misal: `tasktivity`)
4. Salin key yang muncul — ini adalah `AI_KEY` (format: `sk-or-v1-...`)
5. Isi saldo di **Credits** — untuk `gpt-4o-mini` biayanya sangat murah (~$0.001/request)

Model default yang dipakai adalah `openai/gpt-4o-mini`. Bisa diganti di `config.js` jika mau pakai model lain.

---

### 3. Telegram Bot

**a. Buat bot baru**
1. Buka Telegram, cari **@BotFather**
2. Ketik `/newbot`
3. Ikuti instruksi → masukkan nama dan username bot
4. Salin **Bot Token** yang diberikan (format: `123456:ABCDEFxxx`)

**b. Dapatkan Chat ID kamu**
1. Cari bot **@userinfobot** di Telegram
2. Klik Start → bot akan balas dengan info akunmu
3. Salin angka **Id** yang muncul → ini adalah `CHAT_ID`

---

### 4. n8n Workflow

Kalau pakai **n8n self-host**:
1. Pastikan n8n sudah berjalan di server kamu
2. Buka dashboard n8n
3. Import workflow dari file JSON yang disediakan (lihat bagian Import di bawah)

Kalau pakai **n8n cloud**:
1. Login ke [app.n8n.cloud](https://app.n8n.cloud)
2. Import workflow sama seperti di atas

Setelah import, catat **webhook URL** dari node Telegram Trigger/Webhook — ini nanti dipakai sebagai `N8N_WEBHOOK` di config.

---

### 5. Konfigurasi Config File

Buka file `js/config.js` dan isi semua nilainya:

```javascript
var CONFIG = {
  SUPABASE_URL  : 'https://XXXXXXXXXXXX.supabase.co',   // dari step 1c
  SUPABASE_KEY  : 'eyJhbGci...',                         // anon key dari step 1c
  N8N_WEBHOOK   : 'https://your-n8n.com/webhook/...',    // dari step 4
  AI_URL        : 'https://openrouter.ai/api/v1/chat/completions',
  AI_KEY        : 'sk-or-v1-...',                        // dari step 2
  AI_MODEL      : 'openai/gpt-4o-mini',
  CHAT_ID       : '12345678',                            // dari step 3b

  // Nilai di bawah ini tidak perlu diubah
  XP_TASK       : 10,
  XP_STREAK     : 5,
  XP_AI_SCHED   : 15,
  LVL_BASE      : 100,
  LVL_MULT      : 1.5,

  APP_NAME      : 'Tasktivity',
  VERSION       : '2.0.0'
};
```

---

### 6. Deploy ke Vercel

**Opsi A — Via Vercel CLI**
```bash
npm install -g vercel
cd AI/
vercel
```
Ikuti promptnya, login, dan pilih scope yang benar.

**Opsi B — Via GitHub + Vercel Dashboard**
1. Push folder `AI/` ke repository GitHub (pastikan `config.js` sudah diisi tapi tidak ikut di-commit ke repo publik)
2. Login ke [vercel.com](https://vercel.com) → **Add New Project**
3. Pilih repo → Vercel akan auto-detect sebagai Static Site
4. Klik **Deploy**

> 💡 Untuk production, pertimbangkan simpan API key sebagai **Environment Variables** di Vercel dan load via server-side, bukan hardcode di `config.js`.

---

## Import Workflow n8n

1. Buka dashboard n8n
2. Klik ikon **+** atau **New Workflow**
3. Klik menu tiga titik (⋮) di pojok kanan atas → **Import from File**
4. Pilih file `AI_TASKTIFY_CLEAN.json`
5. Workflow akan ter-import otomatis

**Setelah import, update semua credentials:**
- Cari semua node yang punya header `Authorization` → ganti dengan key kamu
- Cari semua URL Supabase → ganti dengan Project URL kamu
- Cari semua field `chat_id` → ganti dengan Chat ID Telegram kamu
- Aktifkan workflow dengan toggle di pojok kanan atas

---

## Penggantian Key di n8n JSON

File `AI_TASKTIFY_CLEAN.json` sudah dibersihkan dari semua key sensitif. Berikut yang perlu kamu ganti sebelum import atau setelah import langsung dari UI n8n:

| Placeholder | Ganti Dengan | Lokasi |
|---|---|---|
| `YOUR_OPENROUTER_API_KEY` | API key dari openrouter.ai | Header `Authorization` di node HTTP Request ke OpenRouter |
| `YOUR_SUPABASE_API_KEY` | Anon key dari Supabase | Header `apikey` dan `Authorization` di node HTTP Request ke Supabase |
| `YOUR_PROJECT_ID.supabase.co` | Project URL kamu | Field `url` di semua node HTTP Request ke Supabase |
| `YOUR_TELEGRAM_CHAT_ID` | Chat ID Telegram kamu | Field `chatId` di node Telegram, dan variabel di node Code |

---

## Cara Membuka & Menjalankan Lokal

Kalau mau coba di komputer sendiri tanpa deploy:

**1. Pakai VS Code + Live Server (paling mudah)**
```
1. Install ekstensi "Live Server" di VS Code
2. Buka folder AI/ di VS Code
3. Klik kanan index.html → "Open with Live Server"
4. Browser otomatis terbuka di localhost:5500
```

**2. Pakai Python HTTP Server**
```bash
cd AI/
python3 -m http.server 8080
# Buka browser: http://localhost:8080
```

**3. Pakai Node.js**
```bash
cd AI/
npx serve .
# Buka browser di URL yang muncul di terminal
```

> ⚠️ Jangan buka `index.html` langsung klik dua kali (via `file://`) karena browser akan blokir request ke Supabase karena CORS policy.

---

## Troubleshooting

**App muncul tapi data tidak load**
→ Cek `SUPABASE_URL` dan `SUPABASE_KEY` di `config.js` sudah benar.  
→ Buka browser console (F12) — cari error merah terkait Supabase.  
→ Pastikan tabel `schedule` dan `tasks` sudah dibuat di Supabase.

**AI tidak merespons**
→ Cek saldo OpenRouter — kemungkinan habis.  
→ Cek `AI_KEY` di config sudah benar dan tidak ada spasi.  
→ Buka console, cek error dari fetch ke `openrouter.ai`.

**App berjalan dalam "Demo Mode"**
→ Ini normal kalau Supabase belum terhubung. App tetap bisa dipakai dengan data dummy.  
→ Kalau mau pakai data real, pastikan Supabase sudah terkonfigurasi dengan benar.

**n8n tidak menerima pesan Telegram**
→ Pastikan webhook URL di n8n sudah didaftarkan ke Telegram Bot API.  
→ Cek apakah workflow sudah di-activate (toggle hijau di n8n).

**Deploy Vercel gagal**
→ Pastikan tidak ada file dengan ukuran di atas 50MB.  
→ Cek log build di dashboard Vercel untuk detail error.

---

*Dokumentasi ini dibuat untuk proyek Tasktivity v2.0.0. Perbarui jika ada perubahan pada struktur proyek atau stack yang digunakan.*

---

© 2026 Joshua Setiawan. All rights reserved.  
Dilarang menyalin, mendistribusikan, atau memodifikasi tanpa izin tertulis dari pemilik.
