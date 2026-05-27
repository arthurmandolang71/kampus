import { getDb } from '../_db.js'
import { parseId, readJson, errorResponse, badRequest, notFound, isDuplicateError } from '../_helpers.js'

const MAX_LEN = { nip: 20, nama: 100, email: 100, bidang_keahlian: 100 }

function validate(payload) {
  const { nip, nama, email, bidang_keahlian } = payload
  if (!nip || typeof nip !== 'string' || nip.trim() === '') return 'nip wajib diisi'
  if (!nama || typeof nama !== 'string' || nama.trim() === '') return 'nama wajib diisi'
  if (nip.length > MAX_LEN.nip) return `nip maksimal ${MAX_LEN.nip} karakter`
  if (nama.length > MAX_LEN.nama) return `nama maksimal ${MAX_LEN.nama} karakter`
  if (email != null && (typeof email !== 'string' || email.length > MAX_LEN.email)) return 'email tidak valid'
  if (bidang_keahlian != null && (typeof bidang_keahlian !== 'string' || bidang_keahlian.length > MAX_LEN.bidang_keahlian)) {
    return 'bidang_keahlian tidak valid'
  }
  return null
}

function normalize(payload) {
  return {
    nip: payload.nip.trim(),
    nama: payload.nama.trim(),
    email: payload.email ? String(payload.email).trim() : null,
    bidang_keahlian: payload.bidang_keahlian ? String(payload.bidang_keahlian).trim() : null,
  }
}

export async function onRequestGet({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM dosen WHERE id = ?', [id])
    if (!rows.length) return notFound()
    return Response.json(rows[0])
  } catch (e) {
    return errorResponse(e, env)
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const payload = await readJson(request)
    const err = validate(payload)
    if (err) return badRequest(err)
    const v = normalize(payload)
    const db = getDb(env)
    await db.execute(
      'UPDATE dosen SET nip=?, nama=?, email=?, bidang_keahlian=? WHERE id=?',
      [v.nip, v.nama, v.email, v.bidang_keahlian, id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'NIP sudah terdaftar' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    await db.execute('DELETE FROM dosen WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}
