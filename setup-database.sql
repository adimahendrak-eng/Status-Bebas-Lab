-- ═══════════════════════════════════════════════════════════
--  SETUP DATABASE SUPABASE – Bebas Lab
--  Laboratorium Jalan Raya, Universitas Lampung
--
--  CARA PAKAI:
--  1. Buka project Supabase Anda
--  2. Klik "SQL Editor" di sidebar kiri
--  3. Klik "New query"
--  4. Salin SELURUH isi file ini → Paste → klik "Run"
-- ═══════════════════════════════════════════════════════════

-- 1. Buat tabel mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nama             text NOT NULL,
  npm              text NOT NULL UNIQUE,
  prodi            text DEFAULT '',
  bebas_tunggakan  boolean DEFAULT false,
  sudah_survei     boolean DEFAULT false,
  sudah_evaluasi   boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- 2. Nonaktifkan Row Level Security (RLS) agar bisa diakses publik
--    (Cocok untuk aplikasi internal kampus)
ALTER TABLE mahasiswa DISABLE ROW LEVEL SECURITY;

-- 3. Beri akses baca/tulis ke "anon" role (pengguna tidak login)
GRANT SELECT, INSERT, UPDATE, DELETE ON mahasiswa TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON mahasiswa TO authenticated;

-- 4. Aktifkan Realtime agar dashboard admin auto-refresh
ALTER PUBLICATION supabase_realtime ADD TABLE mahasiswa;

-- ── SELESAI! Klik RUN, lalu kembali ke aplikasi. ──
