import { getDb } from '../_db.js'

function calcGrade(n) {
  if (n >= 85) return 'A'
  if (n >= 70) return 'B'
  if (n >= 55) return 'C'
  if (n >= 40) return 'D'
  return 'E'
}

export async function onRequestGet({ env, params }) {
  try {
    const db = getDb(env)
    const result = await db.execute(
      `SELECT n.*, m.nama as mahasiswa_nama, mk.nama as matkul_nama
       FROM nilai n
       JOIN mahasiswa m ON n.mahasiswa_id = m.id
       JOIN mata_kuliah mk ON n.mata_kuliah_id = mk.id
       WHERE n.id = ?`,
      [params.id]
    )
    if (!result.rows.length) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json(result.rows[0])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const { nilai_angka, tahun_akademik } = await request.json()
    if (nilai_angka == null) {
      return Response.json({ error: 'nilai_angka wajib diisi' }, { status: 400 })
    }
    const grade = calcGrade(Number(nilai_angka))
    const db = getDb(env)
    await db.execute(
      'UPDATE nilai SET nilai_angka=?, grade=?, tahun_akademik=? WHERE id=?',
      [nilai_angka, grade, tahun_akademik ?? null, params.id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = getDb(env)
    await db.execute('DELETE FROM nilai WHERE id = ?', [params.id])
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
