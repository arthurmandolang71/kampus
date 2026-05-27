import { getDb } from './_db.js'
import { readJson, errorResponse, badRequest, isDuplicateError } from './_helpers.js'

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

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM dosen ORDER BY id DESC')
    return Response.json(rows)
  } catch (e) {
    return errorResponse(e, env)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await readJson(request)
    const err = validate(payload)
    if (err) return badRequest(err)
    const v = normalize(payload)
    const db = getDb(env)
    await db.execute(
      'INSERT INTO dosen (nip, nama, email, bidang_keahlian) VALUES (?, ?, ?, ?)',
      [v.nip, v.nama, v.email, v.bidang_keahlian]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'NIP sudah terdaftar' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}
