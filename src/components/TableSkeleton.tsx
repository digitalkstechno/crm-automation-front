export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200"></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-300"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(rows)].map((_, i) => (
                <tr key={i} className="bg-white">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
