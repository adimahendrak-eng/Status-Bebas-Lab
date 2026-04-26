/**
 * ═══════════════════════════════════════════════════════════
 *  app.js – Logika Utama Aplikasi Bebas Lab (Supabase)
 *  Laboratorium Jalan Raya – Universitas Lampung
 * ═══════════════════════════════════════════════════════════
 */

// ── Konfigurasi ──────────────────────────────────────────
const ADMIN_PASSWORD = "labjr2025";  // ← Ganti password admin di sini

// ── State ────────────────────────────────────────────────
let allMahasiswa  = [];
let realtimeChannel = null;

// ════════════════════════════════════════════════════════════
//  NAVIGASI & AUTH
// ════════════════════════════════════════════════════════════

function showSection(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`section${cap(name)}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (name === 'cek')   document.getElementById('navCek').classList.add('active');
  if (name === 'admin') document.getElementById('navAdmin').classList.add('active');
}

function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function goAdmin() {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    showSection('admin');
    document.getElementById('navAdmin').classList.add('active');
    document.getElementById('navCek').classList.remove('active');
  } else {
    showSection('login');
  }
}

function loginAdmin() {
  const pass  = document.getElementById('passInput').value;
  const errEl = document.getElementById('loginError');
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('passInput').value = '';
    errEl.style.display = 'none';
    showSection('admin');
    document.getElementById('navAdmin').classList.add('active');
    document.getElementById('navCek').classList.remove('active');
    loadData();
  } else {
    errEl.style.display = 'block';
    document.getElementById('passInput').value = '';
    document.getElementById('passInput').focus();
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('adminLoggedIn');
  if (realtimeChannel) {
    _supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  showSection('cek');
  document.getElementById('navCek').classList.add('active');
  document.getElementById('navAdmin').classList.remove('active');
  showToast('Anda telah keluar dari dashboard admin.');
}

// ════════════════════════════════════════════════════════════
//  SUPABASE – CRUD
// ════════════════════════════════════════════════════════════

/** Load data + aktifkan real-time listener */
async function loadData() {
  await fetchAll();

  // Real-time subscription
  if (realtimeChannel) _supabase.removeChannel(realtimeChannel);

  realtimeChannel = _supabase
    .channel('mahasiswa-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      () => { fetchAll(); }
    )
    .subscribe();
}

/** Ambil semua data dari Supabase */
async function fetchAll() {
  const { data, error } = await _supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    showToast('Gagal memuat data. Cek konfigurasi Supabase.');
    return;
  }
  allMahasiswa = data || [];
  renderTable(allMahasiswa);
  updateStats(allMahasiswa);
}

/** Simpan / Update data mahasiswa */
async function simpanData() {
  const editId = document.getElementById('editDocId').value;
  const nama   = document.getElementById('fNama').value.trim();
  const npm    = document.getElementById('fNpm').value.trim();
  const prodi  = document.getElementById('fProdi').value.trim();

  if (!nama || !npm || !prodi) {
    showToast('Lengkapi semua field (Nama, NPM, Prodi).');
    return;
  }

  const payload = {
    nama,
    npm,
    prodi,
    bebas_tunggakan: document.getElementById('cTunggakan').checked,
    sudah_survei:    document.getElementById('cSurvei').checked,
    sudah_evaluasi:  document.getElementById('cEvaluasi').checked,
  };

  if (editId) {
    // UPDATE
    const { error } = await _supabase
      .from(TABLE)
      .update(payload)
      .eq('id', editId);

    if (error) { showToast('❌ Gagal update: ' + error.message); return; }
    showToast('✅ Data berhasil diperbarui!');
    batalEdit();
  } else {
    // Cek duplikat NPM
    const { data: existing } = await _supabase
      .from(TABLE)
      .select('id')
      .eq('npm', npm)
      .maybeSingle();

    if (existing) {
      showToast('⚠️ NPM sudah terdaftar! Gunakan fitur Edit.');
      return;
    }

    // INSERT
    const { error } = await _supabase.from(TABLE).insert([payload]);
    if (error) { showToast('❌ Gagal simpan: ' + error.message); return; }
    showToast('✅ Data mahasiswa berhasil ditambahkan!');
    resetForm();
  }

  await fetchAll();
}

/** Hapus mahasiswa */
async function hapusData(id) {
  if (!confirm('Yakin ingin menghapus data mahasiswa ini?')) return;
  const { error } = await _supabase.from(TABLE).delete().eq('id', id);
  if (error) { showToast('❌ Gagal menghapus data.'); return; }
  showToast('🗑️ Data berhasil dihapus.');
  await fetchAll();
}

/** Isi form untuk edit */
function editData(id) {
  const m = allMahasiswa.find(m => m.id === id);
  if (!m) return;

  document.getElementById('editDocId').value          = id;
  document.getElementById('fNama').value              = m.nama;
  document.getElementById('fNpm').value               = m.npm;
  document.getElementById('fProdi').value             = m.prodi || '';
  document.getElementById('cTunggakan').checked       = !!m.bebas_tunggakan;
  document.getElementById('cSurvei').checked          = !!m.sudah_survei;
  document.getElementById('cEvaluasi').checked        = !!m.sudah_evaluasi;

  document.getElementById('formTitle').textContent    = 'Edit Data Mahasiswa';
  document.getElementById('btnSimpan').innerHTML      =
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg> Update Data`;
  document.getElementById('btnBatal').style.display  = 'inline-flex';
  document.getElementById('fNama').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function batalEdit() {
  document.getElementById('editDocId').value         = '';
  document.getElementById('formTitle').textContent   = 'Input Data Mahasiswa';
  document.getElementById('btnSimpan').innerHTML     =
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg> Simpan Data`;
  document.getElementById('btnBatal').style.display = 'none';
  resetForm();
}

function resetForm() {
  ['fNama','fNpm','fProdi'].forEach(id => document.getElementById(id).value = '');
  ['cTunggakan','cSurvei','cEvaluasi'].forEach(id => document.getElementById(id).checked = false);
}

// ════════════════════════════════════════════════════════════
//  IMPORT EXCEL
// ════════════════════════════════════════════════════════════

async function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('importStatus');
  statusEl.className = 'import-status';
  statusEl.textContent = '⏳ Memproses file Excel...';
  statusEl.style.display = 'block';

  try {
    const data     = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'arraybuffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      statusEl.className = 'import-status error';
      statusEl.textContent = '❌ File kosong atau tidak ada data.';
      return;
    }

    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    const iNama   = headers.findIndex(h => h.includes('nama'));
    const iNpm    = headers.findIndex(h => h.includes('npm'));
    const iProdi  = headers.findIndex(h => h.includes('prodi') || h.includes('program'));

    if (iNama < 0 || iNpm < 0) {
      statusEl.className = 'import-status error';
      statusEl.textContent = '❌ Kolom "nama" dan "npm" tidak ditemukan di header Excel.';
      return;
    }

    // Ambil semua NPM yang sudah ada
    const { data: existing } = await _supabase.from(TABLE).select('npm');
    const existingNpms = new Set((existing || []).map(r => r.npm));

    const toInsert = [];
    let skipped = 0;

    for (const row of rows.slice(1)) {
      const npm = String(row[iNpm] || '').trim();
      if (!npm || existingNpms.has(npm)) { skipped++; continue; }

      toInsert.push({
        nama:            String(row[iNama] || '').trim(),
        npm,
        prodi:           iProdi >= 0 ? String(row[iProdi] || '').trim() : '',
        bebas_tunggakan: false,
        sudah_survei:    false,
        sudah_evaluasi:  false,
      });
    }

    // Insert batch dengan upsert — duplikat NPM otomatis dilewati
let imported = 0;
const BATCH = 500;
for (let i = 0; i < toInsert.length; i += BATCH) {
  const { data: upserted, error } = await _supabase
    .from(TABLE)
    .upsert(toInsert.slice(i, i + BATCH), {
      onConflict: 'npm',        // jika NPM sudah ada → lewati
      ignoreDuplicates: true    // tidak error, tidak overwrite
    })
    .select();
  if (error) throw error;
  imported += (upserted || []).length;
}

    statusEl.className = 'import-status success';
    statusEl.textContent = `✅ Import selesai! ${imported} data diimport, ${skipped} dilewati (duplikat/kosong).`;
    event.target.value = '';
    await fetchAll();
  } catch (err) {
    console.error(err);
    statusEl.className = 'import-status error';
    statusEl.textContent = '❌ Gagal memproses: ' + (err.message || 'Pastikan format Excel benar.');
  }
}

// ════════════════════════════════════════════════════════════
//  RENDER TABEL
// ════════════════════════════════════════════════════════════

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Belum ada data mahasiswa.</td></tr>';
    return;
  }

  const check = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  const xMark = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  tbody.innerHTML = data.map(m => {
    const bebas = m.bebas_tunggakan && m.sudah_survei && m.sudah_evaluasi;
    return `<tr>
      <td><span style="font-weight:600;color:var(--slate-800)">${escHtml(m.nama)}</span></td>
      <td><code style="font-size:12px;background:var(--blue-50);padding:2px 8px;border-radius:4px">${escHtml(m.npm)}</code></td>
      <td style="font-size:12px;color:var(--slate-500)">${escHtml(m.prodi || '-')}</td>
      <td><span class="${m.bebas_tunggakan ? 'icon-check' : 'icon-x'}">${m.bebas_tunggakan ? check : xMark}</span></td>
      <td><span class="${m.sudah_survei   ? 'icon-check' : 'icon-x'}">${m.sudah_survei   ? check : xMark}</span></td>
      <td><span class="${m.sudah_evaluasi ? 'icon-check' : 'icon-x'}">${m.sudah_evaluasi ? check : xMark}</span></td>
      <td><span class="badge ${bebas ? 'badge-green' : 'badge-yellow'}">${bebas ? '✓ Bebas Lab' : '⏳ Belum'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="editData('${m.id}')">Edit</button>
          <button class="btn-del"  onclick="hapusData('${m.id}')">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!q) { renderTable(allMahasiswa); return; }
  renderTable(allMahasiswa.filter(m =>
    m.npm.toLowerCase().includes(q) ||
    m.nama.toLowerCase().includes(q) ||
    (m.prodi && m.prodi.toLowerCase().includes(q))
  ));
}

function updateStats(data) {
  const bebas = data.filter(m => m.bebas_tunggakan && m.sudah_survei && m.sudah_evaluasi).length;
  document.getElementById('statTotal').textContent = data.length;
  document.getElementById('statBebas').textContent = bebas;
  document.getElementById('statBelum').textContent = data.length - bebas;
}

// ════════════════════════════════════════════════════════════
//  CEK STATUS MAHASISWA (PUBLIC)
// ════════════════════════════════════════════════════════════

const INDIKATOR_LABELS = [
  { key: 'bebas_tunggakan', label: 'Tidak ada tunggakan ganti rugi alat' },
  { key: 'sudah_survei',    label: 'Sudah mengisi Survei Kepuasan Pengguna Layanan Laboratorium' },
  { key: 'sudah_evaluasi',  label: 'Sudah mengisi Evaluasi Implementasi E-Survei' },
];

async function cekStatus() {
  const npm = document.getElementById('npmInput').value.trim();
  if (!npm) { showToast('Masukkan NPM terlebih dahulu.'); return; }

  const btn = document.querySelector('#sectionCek .btn-primary');
  btn.innerHTML = '⏳ Mencari...';
  btn.disabled = true;

  try {
    const { data, error } = await _supabase
      .from(TABLE)
      .select('*')
      .eq('npm', npm)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      showModal('notfound', { npm });
    } else {
      const bebas = data.bebas_tunggakan && data.sudah_survei && data.sudah_evaluasi;
      showModal(bebas ? 'success' : 'warning', data);
    }
  } catch (err) {
    console.error(err);
    showToast('Gagal terhubung ke database. Cek konfigurasi Supabase.');
  } finally {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Cek Status`;
    btn.disabled = false;
  }
}

document.getElementById('npmInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') cekStatus();
});

// ════════════════════════════════════════════════════════════
//  MODAL
// ════════════════════════════════════════════════════════════

function showModal(type, data) {
  const box  = document.getElementById('modalContent');
  const check = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><polyline points="20 6 9 17 4 12"/></svg>`;
  const xMark = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  let html = '';

  if (type === 'success') {
    html = `
      <div class="modal-success">
        <div class="modal-icon">🎉</div>
        <p class="modal-npm">NPM: ${escHtml(data.npm)}</p>
        <p class="modal-name">${escHtml(data.nama)}</p>
        <p class="modal-title" style="color:var(--green-700)">Selamat! Anda dinyatakan</p>
        <p style="font-size:28px;font-weight:900;color:var(--green-600);letter-spacing:-.02em;margin-bottom:20px">BEBAS LAB ✓</p>
        <div class="modal-list">
          ${INDIKATOR_LABELS.map(ind =>
            `<div class="modal-list-item ok">${check}${ind.label}</div>`
          ).join('')}
        </div>
      </div>`;
  } else if (type === 'warning') {
    html = `
      <div class="modal-warning">
        <div class="modal-icon">⚠️</div>
        <p class="modal-npm">NPM: ${escHtml(data.npm)}</p>
        <p class="modal-name">${escHtml(data.nama)}</p>
        <p class="modal-title">Status: BELUM BEBAS LAB</p>
        <p style="font-size:13px;color:var(--slate-500);margin-bottom:16px">Selesaikan kewajiban berikut ini:</p>
        <div class="modal-list">
          ${INDIKATOR_LABELS.map(ind =>
            data[ind.key]
              ? `<div class="modal-list-item ok">${check}${ind.label}</div>`
              : `<div class="modal-list-item bad">${xMark}${ind.label}</div>`
          ).join('')}
        </div>
      </div>`;
  } else {
    html = `
      <div class="modal-notfound">
        <div class="modal-icon">🔍</div>
        <p class="modal-title">Data Tidak Ditemukan</p>
        <p style="font-size:14px;color:var(--slate-500);line-height:1.7">
          NPM <strong>${escHtml(data.npm)}</strong> tidak terdaftar dalam sistem.<br>
          Hubungi petugas laboratorium untuk mendaftarkan data Anda.
        </p>
      </div>`;
  }

  box.innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
