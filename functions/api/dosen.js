import { getDb } from './_db.js'

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM dosen ORDER BY id DESC')
    return Response.json(rows)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { nip, nama, email, bidang_keahlian } = await request.json()
    if (!nip || !nama) {
      return Response.json({ error: 'nip dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'INSERT INTO dosen (nip, nama, email, bidang_keahlian) VALUES (?, ?, ?, ?)',
      [nip, nama, email ?? null, bidang_keahlian ?? null]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'NIP sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}
