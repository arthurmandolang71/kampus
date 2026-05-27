import { getDb } from '../_db.js'

export async function onRequestGet({ env, params }) {
  try {
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT kp.*, m.nama AS nama_mahasiswa, m.nim
       FROM kesan_pesan kp
       LEFT JOIN mahasiswa m ON m.id = kp.mahasiswa_id
       WHERE kp.id = ?`,
      [params.id]
    )
    if (!rows.length) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json(rows[0])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const { mahasiswa_id, kesan, pesan, kategori } = await request.json()
    if (!mahasiswa_id || !kesan || !pesan) {
      return Response.json({ error: 'mahasiswa, kesan, dan pesan wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'UPDATE kesan_pesan SET mahasiswa_id=?, kesan=?, pesan=?, kategori=? WHERE id=?',
      [mahasiswa_id, kesan, pesan, kategori ?? 'Umum', params.id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = getDb(env)
    await db.execute('DELETE FROM kesan_pesan WHERE id = ?', [params.id])
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
