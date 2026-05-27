import { useState, useMemo } from 'react'
import Table from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import { useApi, apiRequest } from '../hooks/useApi.js'

const GRADE_COLOR = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
}

const COLUMNS = [
  { key: 'mahasiswa_nama', label: 'Mahasiswa' },
  { key: 'matkul_nama', label: 'Mata Kuliah' },
  { key: 'nilai_angka', label: 'Nilai' },
  {
    key: 'grade',
    label: 'Grade',
    render: row => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${GRADE_COLOR[row.grade] ?? ''}`}>
        {row.grade ?? '-'}
      </span>
    ),
  },
  { key: 'tahun_akademik', label: 'Tahun Akademik' },
]

const EMPTY = { mahasiswa_id: '', mata_kuliah_id: '', nilai_angka: '', tahun_akademik: '' }

export default function Nilai() {
  const { data: mahasiswaList } = useApi('mahasiswa')
  const { data: matkulList } = useApi('mata-kuliah')

  const [filterMhs, setFilterMhs] = useState('')
  const [filterMk, setFilterMk] = useState('')

  const queryPath = useMemo(() => {
    if (filterMhs) return `nilai?mahasiswa_id=${filterMhs}`
    if (filterMk) return `nilai?mata_kuliah_id=${filterMk}`
    return 'nilai'
  }, [filterMhs, filterMk])

  const { data, loading, error, refetch } = useApi(queryPath)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  function openAdd() {
    setForm(EMPTY)
    setFormErr('')
    setModal({ mode: 'add' })
  }

  function openEdit(row) {
    setForm({
      mahasiswa_id: row.mahasiswa_id,
      mata_kuliah_id: row.mata_kuliah_id,
      nilai_angka: row.nilai_angka ?? '',
      tahun_akademik: row.tahun_akademik ?? '',
    })
    setFormErr('')
    setModal({ mode: 'edit', row })
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus nilai ${row.mahasiswa_nama} - ${row.matkul_nama}?`)) return
    try {
      await apiRequest('DELETE', `nilai/${row.id}`)
      refetch()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormErr('')
    try {
      if (modal.mode === 'add') {
        await apiRequest('POST', 'nilai', {
          mahasiswa_id: Number(form.mahasiswa_id),
          mata_kuliah_id: Number(form.mata_kuliah_id),
          nilai_angka: Number(form.nilai_angka),
          tahun_akademik: form.tahun_akademik || null,
        })
      } else {
        await apiRequest('PUT', `nilai/${modal.row.id}`, {
          nilai_angka: Number(form.nilai_angka),
          tahun_akademik: form.tahun_akademik || null,
        })
      }
      setModal(null)
      refetch()
    } catch (e) {
      setFormErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function clearFilter() {
    setFilterMhs('')
    setFilterMk('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nilai</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Tambah Nilai
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-600">Filter:</span>
        <select
          value={filterMhs}
          onChange={e => { setFilterMhs(e.target.value); setFilterMk('') }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Mahasiswa</option>
          {mahasiswaList.map(m => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
        <select
          value={filterMk}
          onChange={e => { setFilterMk(e.target.value); setFilterMhs('') }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Mata Kuliah</option>
          {matkulList.map(m => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
        {(filterMhs || filterMk) && (
          <button onClick={clearFilter} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Reset
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Memuat...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <Table columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} />}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Tambah Nilai' : 'Edit Nilai'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal.mode === 'add' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mahasiswa <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={form.mahasiswa_id}
                    onChange={e => setForm(p => ({ ...p, mahasiswa_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Mahasiswa --</option>
                    {mahasiswaList.map(m => (
                      <option key={m.id} value={m.id}>{m.nama} ({m.nim})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={form.mata_kuliah_id}
                    onChange={e => setForm(p => ({ ...p, mata_kuliah_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Mata Kuliah --</option>
                    {matkulList.map(m => (
                      <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nilai (0–100) <span className="text-red-500">*</span></label>
              <input
                type="number" required min="0" max="100" step="0.01"
                value={form.nilai_angka}
                onChange={e => setForm(p => ({ ...p, nilai_angka: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Akademik</label>
              <input
                placeholder="cth: 2024/2025"
                value={form.tahun_akademik}
                onChange={e => setForm(p => ({ ...p, tahun_akademik: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {formErr && <p className="text-red-500 text-sm">{formErr}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
