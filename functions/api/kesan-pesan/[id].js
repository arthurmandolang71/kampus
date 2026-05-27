import { getDb } from '../_db.js'
import { parseId, readJson, errorResponse, badRequest, notFound } from '../_helpers.js'

const MAX_LEN = { kesan: 5000, pesan: 5000, kategori: 50 }
const ALLOWED_KATEGORI = new Set(['Umum', 'Wisuda', 'Akhir Semester', 'Magang', 'Lainnya'])

function validate(payload) {
  const mhsId = parseId(payload.mahasiswa_id)
  if (mhsId === null) return { err: 'mahasiswa_id tidak valid' }
  const { kesan, pesan, kategori } = payload
  if (!kesan || typeof kesan !== 'string' || kesan.trim() === '') return { err: 'kesan wajib diisi' }
  if (!pesan || typeof pesan !== 'string' || pesan.trim() === '') return { err: 'pesan wajib diisi' }
  if (kesan.length > MAX_LEN.kesan) return { err: `kesan maksimal ${MAX_LEN.kesan} karakter` }
  if (pesan.length > MAX_LEN.pesan) return { err: `pesan maksimal ${MAX_LEN.pesan} karakter` }
  const kat = kategori == null || kategori === '' ? 'Umum' : String(kategori).trim()
  if (!ALLOWED_KATEGORI.has(kat)) return { err: 'kategori tidak valid' }
  return {
    value: {
      mahasiswa_id: mhsId,
      kesan: kesan.trim(),
      pesan: pesan.trim(),
      kategori: kat,
    },
  }
}

export async function onRequestGet({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT kp.*, m.nama AS nama_mahasiswa, m.nim
       FROM kesan_pesan kp
       LEFT JOIN mahasiswa m ON m.id = kp.mahasiswa_id
       WHERE kp.id = ?`,
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
    const result = validate(payload)
    if (result.err) return badRequest(result.err)
    const v = result.value
    const db = getDb(env)
    await db.execute(
      'UPDATE kesan_pesan SET mahasiswa_id=?, kesan=?, pesan=?, kategori=? WHERE id=?',
      [v.mahasiswa_id, v.kesan, v.pesan, v.kategori, id]
    )
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    await db.execute('DELETE FROM kesan_pesan WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}
