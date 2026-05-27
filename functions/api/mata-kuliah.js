import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const result = await db.execute(
      `SELECT mk.*, d.nama as dosen_nama
       FROM mata_kuliah mk
       LEFT JOIN dosen d ON mk.dosen_id = d.id
       ORDER BY mk.id DESC`
    )
    return Response.json(result.rows)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { kode, nama, sks, semester, dosen_id } = await request.json()
    if (!kode || !nama) {
      return Response.json({ error: 'kode dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    const result = await db.execute(
      'INSERT INTO mata_kuliah (kode, nama, sks, semester, dosen_id) VALUES (?, ?, ?, ?, ?)',
      [kode, nama, sks ?? null, semester ?? null, dosen_id ?? null]
    )
    return Response.json({ id: Number(result.lastInsertId) }, { status: 201 })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'Kode mata kuliah sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}
