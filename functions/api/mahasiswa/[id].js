import { getDb } from '../_db.js'
import { parseId, readJson, errorResponse, badRequest, notFound, isDuplicateError } from '../_helpers.js'

const MAX_LEN = { nim: 20, nama: 100, email: 100, jurusan: 100 }

function validate(payload) {
  const { nim, nama, email, jurusan, angkatan } = payload
  if (!nim || typeof nim !== 'string' || nim.trim() === '') return 'nim wajib diisi'
  if (!nama || typeof nama !== 'string' || nama.trim() === '') return 'nama wajib diisi'
  if (nim.length > MAX_LEN.nim) return `nim maksimal ${MAX_LEN.nim} karakter`
  if (nama.length > MAX_LEN.nama) return `nama maksimal ${MAX_LEN.nama} karakter`
  if (email != null && (typeof email !== 'string' || email.length > MAX_LEN.email)) return 'email tidak valid'
  if (jurusan != null && (typeof jurusan !== 'string' || jurusan.length > MAX_LEN.jurusan)) return 'jurusan tidak valid'
  if (angkatan != null && angkatan !== '') {
    const n = Number(angkatan)
    if (!Number.isInteger(n) || n < 1900 || n > 2100) return 'angkatan harus tahun yang valid'
  }
  return null
}

function normalize(payload) {
  return {
    nim: payload.nim.trim(),
    nama: payload.nama.trim(),
    email: payload.email ? String(payload.email).trim() : null,
    jurusan: payload.jurusan ? String(payload.jurusan).trim() : null,
    angkatan: payload.angkatan != null && payload.angkatan !== '' ? Number(payload.angkatan) : null,
  }
}

export async function onRequestGet({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM mahasiswa WHERE id = ?', [id])
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
      'UPDATE mahasiswa SET nim=?, nama=?, email=?, jurusan=?, angkatan=? WHERE id=?',
      [v.nim, v.nama, v.email, v.jurusan, v.angkatan, id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    await db.execute('DELETE FROM mahasiswa WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}
