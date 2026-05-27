import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/mahasiswa', label: 'Mahasiswa' },
  { to: '/dosen', label: 'Dosen' },
  { to: '/mata-kuliah', label: 'Mata Kuliah' },
  { to: '/nilai', label: 'Nilai' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-56 bg-blue-900 text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 text-lg font-bold border-b border-blue-800 tracking-wide">
          Aplikasi Kampus
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-700 font-medium'
                    : 'hover:bg-blue-800 text-blue-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
