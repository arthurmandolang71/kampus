import { connect } from '@tidbcloud/serverless'

const db = connect({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  username: '3aVUiXqotVQQEkW.root',
  password: 'HayU2dqhMlIVN5Bj',
  database: 'mahasiswa',
})

const namaDepan = ['Ahmad','Budi','Citra','Dewi','Eko','Fitri','Galih','Hendra',
  'Indah','Joko','Kartika','Lina','Made','Nina','Oki','Putri','Rizki','Siti',
  'Taufik','Umi','Vina','Wahyu','Yudi','Zara','Agus','Bagas','Dian','Rani',
  'Surya','Tari']
const namaBelakang = ['Santoso','Wahyuni','Pratama','Rahayu','Hidayat','Lestari',
  'Permana','Wulandari','Setiawan','Kurniawan','Sari','Nugroho','Utami','Susanto',
  'Handayani','Wijaya','Kusuma','Purnama','Saputra','Maulana']
const jurusanList = ['Teknik Informatika','Sistem Informasi','Manajemen Informatika',
  'Teknik Komputer','Ilmu Komputer']
const angkatanList = [2020, 2021, 2022, 2023, 2024]
const bidangList = ['Algoritma dan Pemrograman','Basis Data','Jaringan Komputer',
  'Kecerdasan Buatan','Pemrograman Web','Sistem Operasi','Matematika Diskrit',
  'Statistika','Keamanan Informasi','Pengolahan Citra','Rekayasa Perangkat Lunak',
  'Komputasi Awan','Pemrograman Mobile','Analisis Data','Machine Learning']
const matkulList = ['Algoritma dan Pemrograman','Basis Data','Jaringan Komputer',
  'Kecerdasan Buatan','Pemrograman Web','Sistem Operasi','Matematika Diskrit',
  'Statistika Dasar','Keamanan Informasi','Pengolahan Citra Digital',
  'Rekayasa Perangkat Lunak','Komputasi Awan','Pemrograman Mobile',
  'Sistem Informasi Manajemen','Analisis Data','Machine Learning','Deep Learning',
  'Computer Vision','Natural Language Processing','Embedded System']

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function nama() { return `${pick(namaDepan)} ${pick(namaBelakang)}` }
function grade(n) {
  if (n >= 85) return 'A'
  if (n >= 70) return 'B'
  if (n >= 55) return 'C'
  if (n >= 40) return 'D'
  return 'E'
}

async function seed() {
  // ── 1. DOSEN ────────────────────────────────────────────────────────────────
  console.log('Inserting 100 dosen...')
  const dosenRows = Array.from({ length: 100 }, (_, i) => [
    `D${String(i + 1).padStart(6, '0')}`,
    nama(),
    `dosen${i + 1}@kampus.ac.id`,
    pick(bidangList),
  ])
  const dosenPlaceholders = dosenRows.map(() => '(?,?,?,?)').join(',')
  await db.execute(
    `INSERT INTO dosen (nip,nama,email,bidang_keahlian) VALUES ${dosenPlaceholders}`,
    dosenRows.flat()
  )
  console.log('✓ Dosen selesai')

  // ── 2. MAHASISWA ─────────────────────────────────────────────────────────────
  console.log('Inserting 100 mahasiswa...')
  const mhsRows = Array.from({ length: 100 }, (_, i) => {
    const angkatan = pick(angkatanList)
    return [
      `${angkatan}${String(i + 1).padStart(5, '0')}`,
      nama(),
      `mhs${i + 1}@student.ac.id`,
      pick(jurusanList),
      angkatan,
    ]
  })
  const mhsPlaceholders = mhsRows.map(() => '(?,?,?,?,?)').join(',')
  await db.execute(
    `INSERT INTO mahasiswa (nim,nama,email,jurusan,angkatan) VALUES ${mhsPlaceholders}`,
    mhsRows.flat()
  )
  console.log('✓ Mahasiswa selesai')

  // ── 3. MATA KULIAH ───────────────────────────────────────────────────────────
  console.log('Fetching dosen IDs...')
  const dosenIdRows = await db.execute('SELECT id FROM dosen ORDER BY id')
  const dosenIds = dosenIdRows.map(r => Number(r.id))

  console.log('Inserting 100 mata kuliah...')
  const mkRows = Array.from({ length: 100 }, (_, i) => {
    const base = matkulList[i % matkulList.length]
    const suffix = Math.floor(i / matkulList.length) + 1
    const namaKul = suffix > 1 ? `${base} ${suffix}` : base
    return [
      `MK${String(i + 1).padStart(4, '0')}`,
      namaKul,
      pick([2, 3, 4]),
      randInt(1, 8),
      pick(dosenIds),
    ]
  })
  const mkPlaceholders = mkRows.map(() => '(?,?,?,?,?)').join(',')
  await db.execute(
    `INSERT INTO mata_kuliah (kode,nama,sks,semester,dosen_id) VALUES ${mkPlaceholders}`,
    mkRows.flat()
  )
  console.log('✓ Mata kuliah selesai')

  // ── 4. NILAI ─────────────────────────────────────────────────────────────────
  console.log('Fetching mahasiswa & mata kuliah IDs...')
  const mhsIdRows = await db.execute('SELECT id FROM mahasiswa ORDER BY id')
  const mkIdRows = await db.execute('SELECT id FROM mata_kuliah ORDER BY id')
  const mhsIds = mhsIdRows.map(r => Number(r.id))
  const mkIds = mkIdRows.map(r => Number(r.id))
  const tahunList = ['2023/2024', '2024/2025']

  console.log('Inserting 100 nilai...')
  // Setiap mahasiswa ke-i dapat nilai di mata kuliah ke-i (unik per kombinasi)
  const nilaiRows = Array.from({ length: 100 }, (_, i) => {
    const n = randInt(50, 100)
    return [
      mhsIds[i],
      mkIds[i],
      n,
      grade(n),
      pick(tahunList),
    ]
  })
  const nilaiPlaceholders = nilaiRows.map(() => '(?,?,?,?,?)').join(',')
  await db.execute(
    `INSERT INTO nilai (mahasiswa_id,mata_kuliah_id,nilai_angka,grade,tahun_akademik) VALUES ${nilaiPlaceholders}`,
    nilaiRows.flat()
  )
  console.log('✓ Nilai selesai')

  console.log('\n✅ Selesai! 100 data per tabel berhasil dimasukkan.')
}

seed().catch(e => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})
