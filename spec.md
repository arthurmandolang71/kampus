# Spec: Aplikasi Kampus Sederhana

## Ringkasan

Aplikasi manajemen kampus berbasis web untuk mengelola data Mahasiswa, Dosen, Mata Kuliah, dan Nilai. Di-deploy di Cloudflare Pages (frontend + serverless API via Pages Functions), database TiDB Cloud.

---

## Stack Teknologi

| Layer      | Pilihan                              | Alasan                                                                  |
|------------|--------------------------------------|-------------------------------------------------------------------------|
| Frontend   | React + Vite                         | Build output statis, cocok untuk CF Pages                              |
| Styling    | Tailwind CSS v3                      | Utility-first, tidak butuh runtime                                     |
| Routing    | React Router v6 (hash mode)          | Hindari masalah 404 pada CF Pages SPA                                  |
| API        | Cloudflare Pages Functions           | Otomatis jadi CF Worker dari folder `functions/`                       |
| DB Driver  | `@tidbcloud/serverless`              | Satu-satunya driver MySQL yang bekerja di CF Workers (pakai HTTP/fetch) |
| Database   | TiDB Cloud (MySQL-compatible)        | Sudah disediakan                                                        |
| Deploy     | Cloudflare Pages                     | Target deploy                                                           |

> **PENTING**: Jangan gunakan `mysql2` atau driver berbasis TCP — CF Workers tidak mendukung TCP socket. `@tidbcloud/serverless` menggunakan HTTP di balik layar, sehingga aman untuk edge runtime.

---

## Struktur Proyek

```
kampus/
├── functions/                    # CF Pages Functions → otomatis jadi API Workers
│   └── api/
│       ├── _middleware.js        # CORS middleware global
│       ├── dashboard.js          # GET /api/dashboard
│       ├── mahasiswa.js          # GET, POST /api/mahasiswa
│       ├── mahasiswa/
│       │   └── [id].js           # GET, PUT, DELETE /api/mahasiswa/:id
│       ├── mata-kuliah.js        # GET, POST /api/mata-kuliah
│       ├── mata-kuliah/
│       │   └── [id].js           # GET, PUT, DELETE /api/mata-kuliah/:id
│       ├── dosen.js              # GET, POST /api/dosen
│       ├── dosen/
│       │   └── [id].js           # GET, PUT, DELETE /api/dosen/:id
│       ├── nilai.js              # GET, POST /api/nilai
│       └── nilai/
│           └── [id].js           # GET, PUT, DELETE /api/nilai/:id
├── src/
│   ├── components/
│   │   ├── Layout.jsx            # Sidebar + header wrapper
│   │   ├── Table.jsx             # Reusable data table
│   │   ├── Modal.jsx             # Form modal (tambah/edit)
│   │   └── StatCard.jsx          # Card statistik dashboard
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Mahasiswa.jsx
│   │   ├── MataKuliah.jsx
│   │   ├── Dosen.jsx
│   │   └── Nilai.jsx
│   ├── hooks/
│   │   └── useApi.js             # Custom hook fetch ke /api/*
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── _redirects                # SPA fallback (WAJIB untuk CF Pages)
├── .dev.vars                     # Env vars lokal (jangan di-commit)
├── .dev.vars.example             # Template env vars
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── wrangler.toml                 # Konfigurasi CF Pages local dev
```

---

## Skema Database

```sql
-- Jalankan sekali di TiDB Cloud Console atau via MCP

CREATE TABLE IF NOT EXISTS mahasiswa (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nim         VARCHAR(20)  UNIQUE NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  email       VARCHAR(100),
  jurusan     VARCHAR(100),
  angkatan    YEAR,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dosen (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nip             VARCHAR(20)  UNIQUE NOT NULL,
  nama            VARCHAR(100) NOT NULL,
  email           VARCHAR(100),
  bidang_keahlian VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mata_kuliah (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  kode       VARCHAR(20)  UNIQUE NOT NULL,
  nama       VARCHAR(100) NOT NULL,
  sks        TINYINT,
  semester   TINYINT,
  dosen_id   INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS nilai (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  mahasiswa_id   INT NOT NULL,
  mata_kuliah_id INT NOT NULL,
  nilai_angka    DECIMAL(5,2),
  grade          VARCHAR(2),
  tahun_akademik VARCHAR(20),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nilai (mahasiswa_id, mata_kuliah_id, tahun_akademik),
  FOREIGN KEY (mahasiswa_id)   REFERENCES mahasiswa(id)   ON DELETE CASCADE,
  FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE
);
```

---

## API Endpoints

Semua response JSON. Error format: `{ "error": "pesan" }`.

### Dashboard
| Method | Path            | Deskripsi                                 |
|--------|-----------------|-------------------------------------------|
| GET    | /api/dashboard  | Total mahasiswa, dosen, matkul, rata nilai|

### Mahasiswa
| Method | Path                  | Body                                      |
|--------|-----------------------|-------------------------------------------|
| GET    | /api/mahasiswa        | — (list semua)                            |
| POST   | /api/mahasiswa        | `{nim, nama, email, jurusan, angkatan}`   |
| GET    | /api/mahasiswa/:id    | —                                         |
| PUT    | /api/mahasiswa/:id    | field yang diubah                         |
| DELETE | /api/mahasiswa/:id    | —                                         |

### Dosen
| Method | Path              | Body                                          |
|--------|-------------------|-----------------------------------------------|
| GET    | /api/dosen        | —                                             |
| POST   | /api/dosen        | `{nip, nama, email, bidang_keahlian}`         |
| GET    | /api/dosen/:id    | —                                             |
| PUT    | /api/dosen/:id    | field yang diubah                             |
| DELETE | /api/dosen/:id    | —                                             |

### Mata Kuliah
| Method | Path                  | Body                                      |
|--------|-----------------------|-------------------------------------------|
| GET    | /api/mata-kuliah      | —                                         |
| POST   | /api/mata-kuliah      | `{kode, nama, sks, semester, dosen_id}`   |
| GET    | /api/mata-kuliah/:id  | —                                         |
| PUT    | /api/mata-kuliah/:id  | field yang diubah                         |
| DELETE | /api/mata-kuliah/:id  | —                                         |

### Nilai
| Method | Path          | Body                                                        |
|--------|---------------|-------------------------------------------------------------|
| GET    | /api/nilai    | query: `?mahasiswa_id=` atau `?mata_kuliah_id=`             |
| POST   | /api/nilai    | `{mahasiswa_id, mata_kuliah_id, nilai_angka, tahun_akademik}`|
| GET    | /api/nilai/:id| —                                                           |
| PUT    | /api/nilai/:id| `{nilai_angka}`                                             |
| DELETE | /api/nilai/:id| —                                                           |

> Grade dihitung otomatis di server: A ≥85, B ≥70, C ≥55, D ≥40, E <40.

---

## Halaman Frontend

### Dashboard
- Kartu statistik: total mahasiswa, dosen, mata kuliah, rata-rata nilai
- Tabel 5 mahasiswa terbaru

### Mahasiswa
- Tabel: NIM, Nama, Jurusan, Angkatan, Aksi
- Tombol tambah → modal form
- Edit inline via modal
- Hapus dengan konfirmasi

### Dosen
- Tabel: NIP, Nama, Bidang Keahlian, Email, Aksi
- Modal tambah/edit

### Mata Kuliah
- Tabel: Kode, Nama, SKS, Semester, Dosen Pengampu, Aksi
- Modal tambah/edit (dropdown dosen dari API)

### Nilai
- Filter by mahasiswa atau mata kuliah
- Tabel: Mahasiswa, Mata Kuliah, Nilai, Grade, Tahun Akademik, Aksi
- Modal tambah/edit

---

## Konfigurasi File Kritis

### `public/_redirects`
```
/*  /index.html  200
```
Wajib ada agar React Router hash-mode tetap berfungsi dan CF Pages tidak return 404 saat refresh.

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
```

### `wrangler.toml`
```toml
name = "kampus"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

# Variabel non-sensitif untuk lokal dev
# Variabel sensitif (password) wajib via CF Pages dashboard
[vars]
TIDB_HOST     = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
TIDB_PORT     = "4000"
TIDB_USERNAME = "3aVUiXqotVQQEkW.root"
TIDB_DATABASE = "mahasiswa"
```

### `.dev.vars` (lokal saja, jangan commit)
```
TIDB_PASSWORD=HayU2dqhMlIVN5Bj
```

### `.dev.vars.example`
```
TIDB_PASSWORD=your_password_here
```

### `.gitignore`
```
node_modules/
dist/
.dev.vars
.env
```

---

## Koneksi Database (Pattern di setiap Function)

```js
// functions/api/_db.js  ← helper shared
import { connect } from '@tidbcloud/serverless'

export function getDb(env) {
  return connect({
    host:     env.TIDB_HOST,
    port:     Number(env.TIDB_PORT),
    username: env.TIDB_USERNAME,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
    ssl: { minVersion: 'TLSv1.2' },
  })
}
```

```js
// Contoh penggunaan di functions/api/mahasiswa.js
import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  const client = getDb(env)
  const result = await client.execute('SELECT * FROM mahasiswa ORDER BY id DESC')
  return Response.json(result.rows)
}

export async function onRequestPost({ request, env }) {
  const body = await request.json()
  const { nim, nama, email, jurusan, angkatan } = body
  if (!nim || !nama) return Response.json({ error: 'nim dan nama wajib' }, { status: 400 })
  const client = getDb(env)
  const result = await client.execute(
    'INSERT INTO mahasiswa (nim, nama, email, jurusan, angkatan) VALUES (?, ?, ?, ?, ?)',
    [nim, nama, email, jurusan, angkatan]
  )
  return Response.json({ id: Number(result.lastInsertId) }, { status: 201 })
}
```

---

## CORS Middleware

```js
// functions/api/_middleware.js
export async function onRequest({ request, next }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const response = await next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}
```

---

## `package.json`

```json
{
  "name": "kampus",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler pages dev --compatibility-date=2024-09-23 -- vite",
    "build": "vite build",
    "preview": "wrangler pages dev dist"
  },
  "dependencies": {
    "@tidbcloud/serverless": "^0.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8",
    "wrangler": "^3.78.0"
  }
}
```

---

## Langkah Deploy ke Cloudflare Pages

1. **Push ke GitHub** — pastikan `.dev.vars` di `.gitignore`
2. **Buat project di CF Pages** → Connect to Git → pilih repo
3. **Build settings:**
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** di CF Pages dashboard → Settings → Environment Variables:
   - `TIDB_HOST` = `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
   - `TIDB_PORT` = `4000`
   - `TIDB_USERNAME` = `3aVUiXqotVQQEkW.root`
   - `TIDB_PASSWORD` = `HayU2dqhMlIVN5Bj`
   - `TIDB_DATABASE` = `mahasiswa`
   - Set untuk **Production** dan **Preview**
5. **Deploy** → CF Pages otomatis mendeteksi folder `functions/` sebagai Workers

---

## Urutan Pengerjaan

1. [ ] Init project: `npm create vite@latest . -- --template react`
2. [ ] Install dependencies
3. [ ] Setup Tailwind CSS
4. [ ] Buat skema DB di TiDB Cloud (jalankan SQL di atas)
5. [ ] Buat `functions/api/_db.js` (helper koneksi)
6. [ ] Buat `functions/api/_middleware.js` (CORS)
7. [ ] Implementasi semua API functions (mahasiswa, dosen, mata-kuliah, nilai, dashboard)
8. [ ] Buat komponen React: Layout, Table, Modal, StatCard
9. [ ] Buat semua halaman React
10. [ ] Buat `public/_redirects`
11. [ ] Test lokal: `npm run dev`
12. [ ] `npm run build` — pastikan tidak ada error
13. [ ] Deploy ke CF Pages

---

## Potensi Masalah & Solusi

| Masalah                                      | Solusi                                                              |
|----------------------------------------------|---------------------------------------------------------------------|
| 404 saat refresh halaman di CF Pages         | `public/_redirects` dengan `/* /index.html 200`                    |
| `mysql2` tidak bisa dipakai di CF Workers    | Gunakan `@tidbcloud/serverless` (HTTP-based)                        |
| CORS error dari browser ke `/api/*`          | `functions/api/_middleware.js` menangani preflight OPTIONS          |
| ENV vars tidak terbaca di Functions          | Pastikan di-set di CF Pages dashboard, bukan hanya di `wrangler.toml`|
| TiDB SSL error                               | Set `ssl: { minVersion: 'TLSv1.2' }` di connect options            |
| Functions tidak terdeteksi CF Pages          | Folder harus bernama `functions/` tepat di root repo               |
