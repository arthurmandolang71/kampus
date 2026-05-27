import { getDb } from '../_db.js'

export async function onRequestGet({ env, params }) {
  try {
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT mk.*, d.nama as dosen_nama
       FROM mata_kuliah mk
       LEFT JOIN dosen d ON mk.dosen_id = d.id
       WHERE mk.id = ?`,
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
    const { kode, nama, sks, semester, dosen_id } = await request.json()
    if (!kode || !nama) {
      return Response.json({ error: 'kode dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'UPDATE mata_kuliah SET kode=?, nama=?, sks=?, semester=?, dosen_id=? WHERE id=?',
      [kode, nama, sks ?? null, semester ?? null, dosen_id ?? null, params.id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'Kode mata kuliah sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = getDb(env)
    await db.execute('DELETE FROM mata_kuliah WHERE id = ?', [params.id])
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
