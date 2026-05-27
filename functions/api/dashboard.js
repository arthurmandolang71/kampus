import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const [mhs, dsn, mk, nil, recent] = await Promise.all([
      db.execute('SELECT COUNT(*) as total FROM mahasiswa'),
      db.execute('SELECT COUNT(*) as total FROM dosen'),
      db.execute('SELECT COUNT(*) as total FROM mata_kuliah'),
      db.execute('SELECT AVG(nilai_angka) as avg FROM nilai'),
      db.execute('SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa ORDER BY created_at DESC LIMIT 5'),
    ])

    return Response.json({
      stats: {
        total_mahasiswa: Number(mhs.rows[0]?.total ?? 0),
        total_dosen: Number(dsn.rows[0]?.total ?? 0),
        total_matkul: Number(mk.rows[0]?.total ?? 0),
        rata_nilai: nil.rows[0]?.avg ?? null,
      },
      recent: recent.rows,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
