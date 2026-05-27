import { getDb } from '../_db.js'

export async function onRequestGet({ env, params }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM dosen WHERE id = ?', [params.id])
    if (!rows.length) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json(rows[0])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const { nip, nama, email, bidang_keahlian } = await request.json()
    if (!nip || !nama) {
      return Response.json({ error: 'nip dan nama wajib diisi' }, { status: 400 })
    }
    const db = getDb(env)
    await db.execute(
      'UPDATE dosen SET nip=?, nama=?, email=?, bidang_keahlian=? WHERE id=?',
      [nip, nama, email ?? null, bidang_keahlian ?? null, params.id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (e.message?.includes('Duplicate')) {
      return Response.json({ error: 'NIP sudah terdaftar' }, { status: 409 })
    }
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = getDb(env)
    await db.execute('DELETE FROM dosen WHERE id = ?', [params.id])
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
