const colorMap = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
}

export default function StatCard({ label, value, color = 'blue' }) {
  return (
    <div className={`rounded-xl border p-6 ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value ?? '-'}</p>
    </div>
  )
}
