import { useState } from 'react'
import Table from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import { useApi, apiRequest } from '../hooks/useApi.js'

const COLUMNS = [
  { key: 'nama_mahasiswa', label: 'Mahasiswa' },
  { key: 'nim', label: 'NIM' },
  { key: 'kategori', label: 'Kategori' },
  { key: 'kesan', label: 'Kesan' },
  { key: 'pesan', label: 'Pesan' },
]

const KATEGORI_OPTIONS = ['Umum', 'Wisuda', 'Akhir Semester', 'Magang', 'Lainnya']

const EMPTY = { mahasiswa_id: '', kesan: '', pesan: '', kategori: 'Umum' }

export default function KesanPesan() {
  const { data, loading, error, refetch } = useApi('kesan-pesan')
  const { data: mahasiswaList } = useApi('mahasiswa')
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
      mahasiswa_id: String(row.mahasiswa_id),
      kesan: row.kesan,
      pesan: row.pesan,
      kategori: row.kategori ?? 'Umum',
    })
    setFormErr('')
    setModal({ mode: 'edit', row })
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus kesan & pesan dari "${row.nama_mahasiswa}"?`)) return
    try {
      await apiRequest('DELETE', `kesan-pesan/${row.id}`)
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
      const payload = { ...form, mahasiswa_id: Number(form.mahasiswa_id) }
      if (modal.mode === 'add') {
        await apiRequest('POST', 'kesan-pesan', payload)
      } else {
        await apiRequest('PUT', `kesan-pesan/${modal.row.id}`, payload)
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
        <h1 className="text-2xl font-bold text-gray-800">Kesan &amp; Pesan</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Tambah Kesan &amp; Pesan
        </button>
      </div>

      {loading && <p className="text-gray-500">Memuat...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <Table columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} />}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Tambah Kesan & Pesan' : 'Edit Kesan & Pesan'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mahasiswa<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                required
                value={form.mahasiswa_id}
                onChange={e => setForm(p => ({ ...p, mahasiswa_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Mahasiswa --</option>
                {(mahasiswaList ?? []).map(m => (
                  <option key={m.id} value={m.id}>{m.nama} ({m.nim})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {KATEGORI_OPTIONS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kesan<span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.kesan}
                onChange={e => setForm(p => ({ ...p, kesan: e.target.value }))}
                placeholder="Tuliskan kesan selama kuliah..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesan<span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.pesan}
                onChange={e => setForm(p => ({ ...p, pesan: e.target.value }))}
                placeholder="Tuliskan pesan untuk adik tingkat atau dosen..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
