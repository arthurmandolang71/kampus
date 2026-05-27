import { getDb } from '../_db.js'

export async function onRequestGet({ env, params }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM mahasiswa WHERE id = ?', [params.id])
    if (!rows.length) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json(rows[0])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const { nim, nama, email, jurusan, angkatan } = await request.json()
    if (!nim || !nama) {
      return Response.json({ error: 'nim dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'UPDATE mahasiswa SET nim=?, nama=?, email=?, jurusan=?, angkatan=? WHERE id=?',
      [nim, nama, email ?? null, jurusan ?? null, angkatan ?? null, params.id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = getDb(env)
    await db.execute('DELETE FROM mahasiswa WHERE id = ?', [params.id])
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
