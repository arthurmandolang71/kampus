import { getDb } from '../_db.js'
import { parseId, readJson, errorResponse, badRequest, notFound, isDuplicateError } from '../_helpers.js'

const MAX_LEN = { kode: 20, nama: 100 }

function validate(payload) {
  const { kode, nama, sks, semester, dosen_id } = payload
  if (!kode || typeof kode !== 'string' || kode.trim() === '') return 'kode wajib diisi'
  if (!nama || typeof nama !== 'string' || nama.trim() === '') return 'nama wajib diisi'
  if (kode.length > MAX_LEN.kode) return `kode maksimal ${MAX_LEN.kode} karakter`
  if (nama.length > MAX_LEN.nama) return `nama maksimal ${MAX_LEN.nama} karakter`
  if (sks != null && sks !== '') {
    const n = Number(sks)
    if (!Number.isInteger(n) || n < 1 || n > 10) return 'sks harus integer 1–10'
  }
  if (semester != null && semester !== '') {
    const n = Number(semester)
    if (!Number.isInteger(n) || n < 1 || n > 14) return 'semester harus integer 1–14'
  }
  if (dosen_id != null && dosen_id !== '' && parseId(dosen_id) === null) {
    return 'dosen_id tidak valid'
  }
  return null
}

function normalize(payload) {
  return {
    kode: payload.kode.trim(),
    nama: payload.nama.trim(),
    sks: payload.sks != null && payload.sks !== '' ? Number(payload.sks) : null,
    semester: payload.semester != null && payload.semester !== '' ? Number(payload.semester) : null,
    dosen_id: payload.dosen_id != null && payload.dosen_id !== '' ? parseId(payload.dosen_id) : null,
  }
}

export async function onRequestGet({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT mk.*, d.nama as dosen_nama
       FROM mata_kuliah mk
       LEFT JOIN dosen d ON mk.dosen_id = d.id
       WHERE mk.id = ?`,
      [id]
    )
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
      'UPDATE mata_kuliah SET kode=?, nama=?, sks=?, semester=?, dosen_id=? WHERE id=?',
      [v.kode, v.nama, v.sks, v.semester, v.dosen_id, id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'Kode mata kuliah sudah terdaftar' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    await db.execute('DELETE FROM mata_kuliah WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}
