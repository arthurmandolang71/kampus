# Aplikasi Kampus — Panduan untuk AI Agent

## Tech Stack
| Komponen | Teknologi |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + React Router v6 |
| Backend API | Cloudflare Pages Functions (serverless, folder `functions/`) |
| Database | TiDB Cloud (MySQL-compatible) via HTTP API |
| Deploy | Cloudflare Pages (auto-deploy dari GitHub push ke `main`) |

## Struktur Folder Penting
```
functions/api/          ← Cloudflare Pages Functions (API routes)
  _db.js                ← Database helper: getDb(env).execute(sql, params)
  _middleware.js        ← CORS global untuk semua /api/* routes
  health.js             ← GET /api/health — diagnosis koneksi DB
  mahasiswa.js          ← GET + POST /api/mahasiswa
  mahasiswa/[id].js     ← GET + PUT + DELETE /api/mahasiswa/:id
  (pola sama untuk: dosen, mata-kuliah, nilai, kesan-pesan)
src/
  components/
    Layout.jsx          ← Sidebar nav + Outlet
    Table.jsx           ← Tabel reusable dengan tombol Edit/Delete
    Modal.jsx           ← Modal form Add/Edit
  hooks/useApi.js       ← useApi(path) dan apiRequest(method, path, body)
  pages/                ← Satu file per entitas (Mahasiswa, Dosen, dll.)
  App.jsx               ← Definisi semua routes React Router
schema.sql              ← DDL semua tabel (jalankan di TiDB Console jika reset)
.dev.vars               ← Secret lokal (TIDB_PASSWORD) — jangan di-commit
wrangler.toml           ← Config Cloudflare Pages + TIDB_HOST/USERNAME/DATABASE
```

## Database
- **Host:** `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- **Database:** `mahasiswa`
- **Username:** `3aVUiXqotVQQEkW.root`
- **Password:** ada di `.dev.vars` (lokal) dan Cloudflare Pages Secret (production & preview)
- **HTTP API:** `https://http-{TIDB_HOST}/v1beta/sql` — dipakai `_db.js`, bukan TCP/driver
- **Test koneksi langsung:**
  ```bash
  curl -s -X POST "https://http-gateway01.ap-southeast-1.prod.aws.tidbcloud.com/v1beta/sql" \
    -H "Authorization: Basic $(echo -n '3aVUiXqotVQQEkW.root:<PASSWORD>' | base64)" \
    -H "TiDB-Database: mahasiswa" -H "Content-Type: application/json" \
    -d '{"query": "SHOW TABLES;"}'
  ```

## Tabel Database
| Tabel | Kolom Wajib | Relasi |
|---|---|---|
| `mahasiswa` | `nim` (UNIQUE), `nama` | — |
| `dosen` | `nip` (UNIQUE), `nama` | — |
| `mata_kuliah` | `kode` (UNIQUE), `nama` | FK → dosen |
| `nilai` | `mahasiswa_id`, `mata_kuliah_id`, `tahun_akademik` | FK → mahasiswa, mata_kuliah (CASCADE) |
| `kesan_pesan` | `mahasiswa_id`, `kesan`, `pesan` | FK → mahasiswa (CASCADE) |

## Cara Menjalankan Lokal
```bash
# Terminal 1 — Vite frontend
npx vite --port 5173

# Terminal 2 — Wrangler API proxy (baca .dev.vars otomatis)
npx wrangler pages dev --compatibility-date=2024-09-23 --proxy 5173
# Buka: http://localhost:8788
```
> `npm run dev:full` sudah tidak kompatibel dengan Wrangler 3.114+, gunakan dua perintah di atas.

## Pola CRUD (Wajib Diikuti untuk Fitur Baru)

### Backend (`functions/api/<entitas>.js`)
```js
import { getDb } from './_db.js'

export async function onRequestGet({ env }) { /* SELECT * ORDER BY id DESC */ }
export async function onRequestPost({ request, env }) { /* INSERT + validasi */ }
```
```js
// functions/api/<entitas>/[id].js
import { getDb } from '../_db.js'

export async function onRequestGet({ env, params }) { /* SELECT WHERE id=? */ }
export async function onRequestPut({ request, env, params }) { /* UPDATE */ }
export async function onRequestDelete({ env, params }) { /* DELETE */ }
```

### Frontend (`src/pages/<Entitas>.jsx`)
```jsx
const { data, loading, error, refetch } = useApi('<entitas>')
// Form: useState + apiRequest('POST'/'PUT'/'DELETE', ...)
// UI: <Table columns={COLUMNS} data={data} onEdit={...} onDelete={...} />
// Modal: <Modal title="..." onClose={...}> <form> ... </form> </Modal>
```

### Daftarkan di App.jsx + Layout.jsx
```jsx
// App.jsx
import Entitas from './pages/Entitas.jsx'
<Route path="entitas" element={<Entitas />} />

// Layout.jsx — tambah di navItems
{ to: '/entitas', label: 'Entitas' }
```

## Deploy
- Push ke branch `main` → Cloudflare Pages auto-deploy production
- Push ke branch lain → Cloudflare Pages auto-deploy preview URL
- **Wajib:** `TIDB_PASSWORD` harus diset sebagai **Secret** di Cloudflare Pages untuk **Production** dan **Preview** (Settings → Variables and Secrets)
- Diagnosis deploy: buka `<url>/api/health`

## Hal yang Pernah Menjadi Masalah
- `@tidbcloud/serverless` menyebabkan error `node:stream` di CF Workers — sudah dihapus, jangan tambahkan kembali
- `nodejs_compat` flag tidak diperlukan karena `_db.js` pakai direct HTTP fetch
- Wrangler 3.114+ tidak support `--proxy <port> -- <command>` bersamaan
- Secret `TIDB_PASSWORD` harus ditambahkan terpisah untuk environment **Preview** di Cloudflare Pages

## Health Check
```
GET /api/health
```
Mengembalikan status semua env vars dan koneksi DB. Gunakan ini pertama kali jika ada error koneksi.
