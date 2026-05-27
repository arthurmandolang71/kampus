import { useState } from 'react'
import Table from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import { useApi, apiRequest } from '../hooks/useApi.js'

const COLUMNS = [
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'sks', label: 'SKS' },
  { key: 'semester', label: 'Semester' },
  { key: 'dosen_nama', label: 'Dosen Pengampu' },
]

const EMPTY = { kode: '', nama: '', sks: '', semester: '', dosen_id: '' }

export default function MataKuliah() {
  const { data, loading, error, refetch } = useApi('mata-kuliah')
  const { data: dosenList } = useApi('dosen')
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
      kode: row.kode,
      nama: row.nama,
      sks: row.sks ?? '',
      semester: row.semester ?? '',
      dosen_id: row.dosen_id ?? '',
    })
    setFormErr('')
    setModal({ mode: 'edit', row })
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus mata kuliah "${row.nama}"?`)) return
    try {
      await apiRequest('DELETE', `mata-kuliah/${row.id}`)
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
      const payload = {
        kode: form.kode,
        nama: form.nama,
        sks: form.sks ? Number(form.sks) : null,
        semester: form.semester ? Number(form.semester) : null,
        dosen_id: form.dosen_id ? Number(form.dosen_id) : null,
      }
      if (modal.mode === 'add') {
        await apiRequest('POST', 'mata-kuliah', payload)
      } else {
        await apiRequest('PUT', `mata-kuliah/${modal.row.id}`, payload)
      }
      setModal(null)
      refetch()
    } catch (e) {
      setFormErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mata Kuliah</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Tambah Mata Kuliah
        </button>
      </div>

      {loading && <p className="text-gray-500">Memuat...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <Table columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} />}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Tambah Mata Kuliah' : 'Edit Mata Kuliah'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode <span className="text-red-500">*</span></label>
              <input
                required
                value={form.kode}
                onChange={e => setForm(p => ({ ...p, kode: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
              <input
                required
                value={form.nama}
                onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKS</label>
                <input
                  type="number" min="1" max="6"
                  value={form.sks}
                  onChange={e => setForm(p => ({ ...p, sks: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input
                  type="number" min="1" max="8"
                  value={form.semester}
                  onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pengampu</label>
              <select
                value={form.dosen_id}
                onChange={e => setForm(p => ({ ...p, dosen_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Tidak ada --</option>
                {dosenList.map(d => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
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
