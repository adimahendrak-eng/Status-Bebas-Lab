/**
 * ═══════════════════════════════════════════════════════════
 *  supabase-config.js
 *  Konfigurasi Supabase untuk Aplikasi Bebas Lab
 *  Laboratorium Jalan Raya – Universitas Lampung
 * ═══════════════════════════════════════════════════════════
 *
 *  CARA SETUP (5 menit, GRATIS, tanpa kartu kredit):
 *
 *  1. Buka https://supabase.com → Sign Up (pakai GitHub/Google)
 *  2. Klik "New Project" → isi nama project & password database
 *  3. Tunggu project selesai dibuat (~1 menit)
 *  4. Di sidebar → Settings → API
 *  5. Salin:
 *       - "Project URL"      → isi ke SUPABASE_URL di bawah
 *       - "anon public" key  → isi ke SUPABASE_ANON_KEY di bawah
 *  6. Buat tabel "mahasiswa" via SQL Editor (lihat README.md)
 * ═══════════════════════════════════════════════════════════
 */

const SUPABASE_URL      = "https://qvjjwpkbreeocdjwqmoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amp3cGticmVlb2NkandxbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDUzMzgsImV4cCI6MjA5Mjc4MTMzOH0.9d5gWeK0SbqvdsjB5d0CPxhukHsEcsJQZ3GAvAV9_BM";

// Inisialisasi Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nama tabel di Supabase
const TABLE = "mahasiswa";
