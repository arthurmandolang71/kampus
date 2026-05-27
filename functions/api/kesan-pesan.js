import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT kp.*, m.nama AS nama_mahasiswa, m.nim
       FROM kesan_pesan kp
       LEFT JOIN mahasiswa m ON m.id = kp.mahasiswa_id
       ORDER BY kp.id DESC`
    )
    return Response.json(rows)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { mahasiswa_id, kesan, pesan, kategori } = await request.json()
    if (!mahasiswa_id || !kesan || !pesan) {
      return Response.json({ error: 'mahasiswa, kesan, dan pesan wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'INSERT INTO kesan_pesan (mahasiswa_id, kesan, pesan, kategori) VALUES (?, ?, ?, ?)',
      [mahasiswa_id, kesan, pesan, kategori ?? 'Umum']
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
