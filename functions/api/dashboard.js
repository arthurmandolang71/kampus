import { getDb } from './_db.js'
import { errorResponse } from './_helpers.js'

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
        total_mahasiswa: Number(mhs[0]?.total ?? 0),
        total_dosen: Number(dsn[0]?.total ?? 0),
        total_matkul: Number(mk[0]?.total ?? 0),
        rata_nilai: nil[0]?.avg ?? null,
      },
      recent,
    })
  } catch (e) {
    return errorResponse(e, env)
  }
}
