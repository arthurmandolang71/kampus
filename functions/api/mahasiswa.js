import { getDb } from './_db.js'
import { readJson, errorResponse, badRequest, isDuplicateError } from './_helpers.js'

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

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM mahasiswa ORDER BY id DESC')
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
      'INSERT INTO mahasiswa (nim, nama, email, jurusan, angkatan) VALUES (?, ?, ?, ?, ?)',
      [v.nim, v.nama, v.email, v.jurusan, v.angkatan]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}
