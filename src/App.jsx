import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Mahasiswa from './pages/Mahasiswa.jsx'
import Dosen from './pages/Dosen.jsx'
import MataKuliah from './pages/MataKuliah.jsx'
import Nilai from './pages/Nilai.jsx'
import KesanPesan from './pages/KesanPesan.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="mahasiswa" element={<Mahasiswa />} />
        <Route path="dosen" element={<Dosen />} />
        <Route path="mata-kuliah" element={<MataKuliah />} />
        <Route path="nilai" element={<Nilai />} />
        <Route path="kesan-pesan" element={<KesanPesan />} />
      </Route>
    </Routes>
  )
}
