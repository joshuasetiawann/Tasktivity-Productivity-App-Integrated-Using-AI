/* =====================================================
   © 2026 Joshua Setiawan. All rights reserved.

   TASKTIVITY — Configuration
   Ganti semua nilai di bawah ini sebelum deploy.
   Jangan pernah commit file ini ke repository publik!
   ===================================================== */
'use strict';

var CONFIG = {
  // --- Supabase ---
  // Dapatkan dari: Supabase Dashboard → Project Settings → API
  SUPABASE_URL  : 'YOUR_SUPABASE_PROJECT_URL',        // contoh: https://xyzabc.supabase.co
  SUPABASE_KEY  : 'YOUR_SUPABASE_ANON_KEY',           // anon/public key dari Project Settings → API

  // --- n8n Webhook ---
  // URL webhook dari workflow n8n kamu
  N8N_WEBHOOK   : 'YOUR_N8N_WEBHOOK_URL',             // contoh: https://your-n8n.com/webhook/...

  // --- OpenRouter AI ---
  // Dapatkan dari: https://openrouter.ai → API Keys
  AI_URL        : 'https://openrouter.ai/api/v1/chat/completions',
  AI_KEY        : 'YOUR_OPENROUTER_API_KEY',          // contoh: sk-or-v1-...
  AI_MODEL      : 'openai/gpt-4o-mini',               // bisa diganti model lain

  // --- Telegram ---
  // Chat ID akun Telegram kamu (gunakan @userinfobot untuk cek)
  CHAT_ID       : 'YOUR_TELEGRAM_CHAT_ID',

  // --- Gamification (tidak perlu diubah) ---
  XP_TASK       : 10,
  XP_STREAK     : 5,
  XP_AI_SCHED   : 15,
  LVL_BASE      : 100,
  LVL_MULT      : 1.5,

  APP_NAME      : 'Tasktivity',
  VERSION       : '2.0.0'
};
