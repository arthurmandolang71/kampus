import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const result = await db.execute('SELECT * FROM mahasiswa ORDER BY id DESC')
    return Response.json(result.rows)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { nim, nama, email, jurusan, angkatan } = await request.json()
    if (!nim || !nama) {
      return Response.json({ error: 'nim dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    const result = await db.execute(
      'INSERT INTO mahasiswa (nim, nama, email, jurusan, angkatan) VALUES (?, ?, ?, ?, ?)',
      [nim, nama, email ?? null, jurusan ?? null, angkatan ?? null]
    )
    return Response.json({ id: Number(result.lastInsertId) }, { status: 201 })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}
