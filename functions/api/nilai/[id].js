import { getDb } from '../_db.js'
import { parseId, readJson, errorResponse, badRequest, notFound } from '../_helpers.js'

function calcGrade(n) {
  if (n >= 85) return 'A'
  if (n >= 70) return 'B'
  if (n >= 55) return 'C'
  if (n >= 40) return 'D'
  return 'E'
}

function validateNilaiAngka(raw) {
  if (raw == null || raw === '') return { err: 'nilai_angka wajib diisi' }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { err: 'nilai_angka harus angka' }
  if (n < 0 || n > 100) return { err: 'nilai_angka harus 0–100' }
  return { value: n }
}

function validateTahunAkademik(raw) {
  if (raw == null || raw === '') return { value: null }
  if (typeof raw !== 'string') return { err: 'tahun_akademik tidak valid' }
  const trimmed = raw.trim()
  if (trimmed.length > 20) return { err: 'tahun_akademik terlalu panjang' }
  return { value: trimmed }
}

export async function onRequestGet({ env, params }) {
  try {
    const id = parseId(params.id)
    if (id === null) return badRequest('id tidak valid')
    const db = getDb(env)
    const rows = await db.execute(
      `SELECT n.*, m.nama as mahasiswa_nama, mk.nama as matkul_nama
       FROM nilai n
       JOIN mahasiswa m ON n.mahasiswa_id = m.id
       JOIN mata_kuliah mk ON n.mata_kuliah_id = mk.id
       WHERE n.id = ?`,
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

    const nilai = validateNilaiAngka(payload.nilai_angka)
    if (nilai.err) return badRequest(nilai.err)

    const ta = validateTahunAkademik(payload.tahun_akademik)
    if (ta.err) return badRequest(ta.err)

    const db = getDb(env)
    await db.execute(
      'UPDATE nilai SET nilai_angka=?, grade=?, tahun_akademik=? WHERE id=?',
      [nilai.value, calcGrade(nilai.value), ta.value, id]
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
    await db.execute('DELETE FROM nilai WHERE id = ?', [id])
    return Response.json({ ok: true })
  } catch (e) {
    return errorResponse(e, env)
  }
}
