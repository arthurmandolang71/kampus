import { getDb } from './_db.js'

function calcGrade(n) {
  if (n >= 85) return 'A'
  if (n >= 70) return 'B'
  if (n >= 55) return 'C'
  if (n >= 40) return 'D'
  return 'E'
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url)
    const mahasiswaId = url.searchParams.get('mahasiswa_id')
    const matkulId = url.searchParams.get('mata_kuliah_id')

    let sql = `SELECT n.*, m.nama as mahasiswa_nama, mk.nama as matkul_nama
               FROM nilai n
               JOIN mahasiswa m ON n.mahasiswa_id = m.id
               JOIN mata_kuliah mk ON n.mata_kuliah_id = mk.id`
    const params = []

    if (mahasiswaId) {
      sql += ' WHERE n.mahasiswa_id = ?'
      params.push(mahasiswaId)
    } else if (matkulId) {
      sql += ' WHERE n.mata_kuliah_id = ?'
      params.push(matkulId)
    }

    sql += ' ORDER BY n.created_at DESC'

    const db = getDb(env)
    const rows = await db.execute(sql, params)
    return Response.json(rows)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { mahasiswa_id, mata_kuliah_id, nilai_angka, tahun_akademik } = await request.json()
    if (!mahasiswa_id || !mata_kuliah_id || nilai_angka == null) {
      return Response.json({ error: 'mahasiswa_id, mata_kuliah_id, dan nilai_angka wajib diisi' }, { status: 400 })
    }
    const grade = calcGrade(Number(nilai_angka))
    const db = getDb(env)
    await db.execute(
      'INSERT INTO nilai (mahasiswa_id, mata_kuliah_id, nilai_angka, grade, tahun_akademik) VALUES (?, ?, ?, ?, ?)',
      [mahasiswa_id, mata_kuliah_id, nilai_angka, grade, tahun_akademik ?? null]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'Nilai untuk mahasiswa dan mata kuliah ini sudah ada' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}
