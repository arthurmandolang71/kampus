import { useState } from 'react'
import Table from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import { useApi, apiRequest } from '../hooks/useApi.js'

const COLUMNS = [
  { key: 'nama', label: 'Nama' },
  { key: 'jenis', label: 'Jenis' },
  { key: 'kondisi', label: 'Kondisi' },
  { key: 'jumlah', label: 'Jumlah' },
]

const EMPTY = { nama: '', jenis: '', kondisi: '', jumlah: 1 }

const FIELDS = [
  { name: 'nama', label: 'Nama', required: true },
  { name: 'jenis', label: 'Jenis (mis. ruangan, alat, kendaraan)' },
  { name: 'kondisi', label: 'Kondisi (mis. baik, rusak ringan, rusak berat)' },
  { name: 'jumlah', label: 'Jumlah', type: 'number' },
]

export default function SaranaPrasarana() {
  const { data, loading, error, refetch } = useApi('sarana-prasarana')
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
      nama: row.nama,
      jenis: row.jenis ?? '',
      kondisi: row.kondisi ?? '',
      jumlah: row.jumlah ?? 1,
    })
    setFormErr('')
    setModal({ mode: 'edit', row })
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus sarana "${row.nama}"?`)) return
    try {
      await apiRequest('DELETE', `sarana-prasarana/${row.id}`)
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
      const payload = { ...form, jumlah: form.jumlah !== '' ? Number(form.jumlah) : 1 }
      if (modal.mode === 'add') {
        await apiRequest('POST', 'sarana-prasarana', payload)
      } else {
        await apiRequest('PUT', `sarana-prasarana/${modal.row.id}`, payload)
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
        <h1 className="text-2xl font-bold text-gray-800">Sarana & Prasarana</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Tambah Sarana
        </button>
      </div>

      {loading && <p className="text-gray-500">Memuat...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <Table columns={COLUMNS} data={data} onEdit={openEdit} onDelete={handleDelete} />}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Tambah Sarana' : 'Edit Sarana'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type={f.type ?? 'text'}
                  required={f.required}
                  value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
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
