import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TableResultViewerProps {
  data: any[];
}

export const TableResultViewer: React.FC<TableResultViewerProps> = ({ data }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Derive column keys from data
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const keysSet = new Set<string>();
    data.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [data]);

  // Filtered and sorted rows
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((row) => {
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      );
    });
  }, [data, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortKey === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        No tabular rows available for this node.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Search and stats bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-emerald-400 font-medium">
            {sortedData.length} records
          </span>
          <span>•</span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-slate-800/80 rounded-lg bg-slate-950/70">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 z-10">
            <tr>
              <th className="p-2.5 text-slate-400 font-semibold w-12 text-center">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="p-2.5 text-slate-300 font-semibold cursor-pointer hover:text-indigo-300 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="capitalize">{col.replace(/_/g, ' ')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-900/60 transition-colors font-mono text-[11px]"
              >
                <td className="p-2.5 text-center text-slate-400 font-sans">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  return (
                    <td key={col} className="p-2.5 text-slate-200 max-w-xs truncate">
                      {Array.isArray(val) ? (
                        <div className="flex flex-wrap gap-1">
                          {val.map((item, i) => (
                            <span
                              key={i}
                              className="bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] border border-indigo-800/40"
                            >
                              {String(item)}
                            </span>
                          ))}
                        </div>
                      ) : typeof val === 'object' && val !== null ? (
                        <span className="text-slate-400">{JSON.stringify(val)}</span>
                      ) : (
                        <span>{String(val ?? '')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
