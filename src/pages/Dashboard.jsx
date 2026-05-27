import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => {
        if (!r.ok) throw new Error('Gagal memuat data')
        return r.json()
      })
      .then(d => {
        setStats(d.stats)
        setRecent(d.recent)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Memuat...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Mahasiswa" value={stats?.total_mahasiswa} color="blue" />
        <StatCard label="Total Dosen" value={stats?.total_dosen} color="green" />
        <StatCard label="Mata Kuliah" value={stats?.total_matkul} color="purple" />
        <StatCard
          label="Rata-rata Nilai"
          value={stats?.rata_nilai ? Number(stats.rata_nilai).toFixed(1) : '0'}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Mahasiswa Terbaru</h2>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada data mahasiswa.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">NIM</th>
                <th className="pb-3 font-medium">Nama</th>
                <th className="pb-3 font-medium">Jurusan</th>
                <th className="pb-3 font-medium">Angkatan</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(m => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-500">{m.nim}</td>
                  <td className="py-2 font-medium text-gray-800">{m.nama}</td>
                  <td className="py-2 text-gray-600">{m.jurusan ?? '-'}</td>
                  <td className="py-2 text-gray-600">{m.angkatan ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
