import { getDb } from './_db.js'
import { readJson, errorResponse, badRequest } from './_helpers.js'

const MAX_LEN = { nama: 150, jenis: 50, kondisi: 50 }

function validate(payload) {
  const { nama, jenis, kondisi, jumlah } = payload
  if (!nama || typeof nama !== 'string' || nama.trim() === '') return 'nama wajib diisi'
  if (nama.length > MAX_LEN.nama) return `nama maksimal ${MAX_LEN.nama} karakter`
  if (jenis != null && (typeof jenis !== 'string' || jenis.length > MAX_LEN.jenis)) return 'jenis tidak valid'
  if (kondisi != null && (typeof kondisi !== 'string' || kondisi.length > MAX_LEN.kondisi)) return 'kondisi tidak valid'
  if (jumlah != null && jumlah !== '') {
    const n = Number(jumlah)
    if (!Number.isInteger(n) || n < 0) return 'jumlah harus bilangan bulat non-negatif'
  }
  return null
}

function normalize(payload) {
  return {
    nama: payload.nama.trim(),
    jenis: payload.jenis ? String(payload.jenis).trim() : null,
    kondisi: payload.kondisi ? String(payload.kondisi).trim() : null,
    jumlah: payload.jumlah != null && payload.jumlah !== '' ? Number(payload.jumlah) : 1,
  }
}

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env)
    const rows = await db.execute('SELECT * FROM sarana_prasarana ORDER BY id DESC')
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
      'INSERT INTO sarana_prasarana (nama, jenis, kondisi, jumlah) VALUES (?, ?, ?, ?)',
      [v.nama, v.jenis, v.kondisi, v.jumlah]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    return errorResponse(e, env)
  }
}
