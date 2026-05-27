import { getDb } from './_db.js'
import { parseId, readJson, errorResponse, badRequest, isDuplicateError } from './_helpers.js'

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

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url)
    const mahasiswaId = parseId(url.searchParams.get('mahasiswa_id'))
    const matkulId = parseId(url.searchParams.get('mata_kuliah_id'))

    let sql = `SELECT n.*, m.nama as mahasiswa_nama, mk.nama as matkul_nama
               FROM nilai n
               JOIN mahasiswa m ON n.mahasiswa_id = m.id
               JOIN mata_kuliah mk ON n.mata_kuliah_id = mk.id`
    const params = []

    if (mahasiswaId !== null) {
      sql += ' WHERE n.mahasiswa_id = ?'
      params.push(mahasiswaId)
    } else if (matkulId !== null) {
      sql += ' WHERE n.mata_kuliah_id = ?'
      params.push(matkulId)
    }

    sql += ' ORDER BY n.created_at DESC'

    const db = getDb(env)
    const rows = await db.execute(sql, params)
    return Response.json(rows)
  } catch (e) {
    return errorResponse(e, env)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await readJson(request)
    const mhsId = parseId(payload.mahasiswa_id)
    const mkId = parseId(payload.mata_kuliah_id)
    if (mhsId === null) return badRequest('mahasiswa_id tidak valid')
    if (mkId === null) return badRequest('mata_kuliah_id tidak valid')

    const nilai = validateNilaiAngka(payload.nilai_angka)
    if (nilai.err) return badRequest(nilai.err)

    const ta = validateTahunAkademik(payload.tahun_akademik)
    if (ta.err) return badRequest(ta.err)

    const db = getDb(env)
    await db.execute(
      'INSERT INTO nilai (mahasiswa_id, mata_kuliah_id, nilai_angka, grade, tahun_akademik) VALUES (?, ?, ?, ?, ?)',
      [mhsId, mkId, nilai.value, calcGrade(nilai.value), ta.value]
    )
    const idRows = await db.execute('SELECT LAST_INSERT_ID() as id')
    return Response.json({ id: Number(idRows[0].id) }, { status: 201 })
  } catch (e) {
    if (isDuplicateError(e)) {
      return Response.json({ error: 'Nilai untuk mahasiswa dan mata kuliah ini sudah ada' }, { status: 409 })
    }
    return errorResponse(e, env)
  }
}
