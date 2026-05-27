export default function Table({ columns, data, onEdit, onDelete }) {
  if (!data.length) {
    return (
      <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
        Belum ada data.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-800">
                  {col.render ? col.render(row) : (row[col.key] ?? '-')}
                </td>
              ))}
              <td className="px-4 py-3 text-sm space-x-3">
                <button
                  onClick={() => onEdit(row)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(row)}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
