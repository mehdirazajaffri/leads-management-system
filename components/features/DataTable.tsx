'use client'

import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export type DataTableColumn<T> = {
  id: string
  header: React.ReactNode
  /** If set, column becomes sortable. */
  sortValue?: (row: T) => string | number | null | undefined
  /** If set, used for global search. */
  searchValue?: (row: T) => string
  cell: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const base = 'h-3 w-3'
  const color = active ? 'text-slate-500' : 'text-slate-300'
  return (
    <span className="inline-flex flex-col leading-none ml-2">
      <svg
        viewBox="0 0 20 20"
        className={`${base} ${color} ${active && dir === 'asc' ? '' : 'opacity-40'}`}
        fill="currentColor"
      >
        <path d="M10 6l-4 4h8l-4-4z" />
      </svg>
      <svg
        viewBox="0 0 20 20"
        className={`${base} ${color} ${active && dir === 'desc' ? '' : 'opacity-40'}`}
        fill="currentColor"
      >
        <path d="M10 14l4-4H6l4 4z" />
      </svg>
    </span>
  )
}

export default function DataTable<T>({
  title,
  subtitle,
  rows,
  columns,
  getRowId,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  selectedIds,
  onSelectedIdsChange,
}: {
  title: string
  subtitle?: string
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  initialPageSize?: number
  pageSizeOptions?: number[]
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
}) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [pageIndex, setPageIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ colId: string; dir: SortDir } | null>(null)

  const searchableCols = useMemo(
    () => columns.filter((c) => c.searchValue),
    [columns]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    if (searchableCols.length === 0) return rows
    return rows.filter((row) =>
      searchableCols.some((c) => (c.searchValue?.(row) || '').toLowerCase().includes(q))
    )
  }, [rows, query, searchableCols])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.id === sort.colId)
    if (!col?.sortValue) return filtered
    const dirMul = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dirMul
      return String(av).localeCompare(String(bv)) * dirMul
    })
  }, [filtered, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)

  const paged = useMemo(() => {
    const start = safePageIndex * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePageIndex, pageSize])

  const selectionEnabled = !!onSelectedIdsChange && !!selectedIds
  const allVisibleSelected = selectionEnabled
    ? paged.every((r) => selectedIds!.includes(getRowId(r)))
    : false

  const toggleAllVisible = () => {
    if (!selectionEnabled) return
    const visibleIds = paged.map(getRowId)
    if (allVisibleSelected) {
      onSelectedIdsChange!(selectedIds!.filter((id) => !visibleIds.includes(id)))
    } else {
      const next = new Set(selectedIds)
      visibleIds.forEach((id) => next.add(id))
      onSelectedIdsChange!(Array.from(next))
    }
  }

  const toggleOne = (id: string) => {
    if (!selectionEnabled) return
    if (selectedIds!.includes(id)) onSelectedIdsChange!(selectedIds!.filter((x) => x !== id))
    else onSelectedIdsChange!([...selectedIds!, id])
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-8 py-6">
        <div className="text-xl font-semibold text-slate-900">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
      </div>

      <div className="px-8 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPageIndex(0)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-600">entries per page</div>
        </div>

        <div className="w-full max-w-sm">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPageIndex(0)
            }}
            placeholder="Search…"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
      </div>

      <div className="px-8 pb-6">
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                {selectionEnabled ? (
                  <th className="px-6 py-4 text-left">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  </th>
                ) : null}
                {columns.map((col) => {
                  const sortable = !!col.sortValue
                  const active = sort?.colId === col.id
                  const dir = active ? sort!.dir : 'asc'
                  return (
                    <th
                      key={col.id}
                      className={[
                        'px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400',
                        col.headerClassName || '',
                        sortable ? 'select-none cursor-pointer' : '',
                      ].join(' ')}
                      onClick={() => {
                        if (!sortable) return
                        setSort((prev) => {
                          if (!prev || prev.colId !== col.id) return { colId: col.id, dir: 'asc' }
                          return { colId: col.id, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                        })
                      }}
                    >
                      <span className="inline-flex items-center">
                        {col.header}
                        {sortable ? <SortIcon active={active} dir={dir} /> : null}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => {
                const id = getRowId(row)
                return (
                  <tr key={id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    {selectionEnabled ? (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds!.includes(id)}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td key={col.id} className={['px-6 py-4 text-sm text-slate-700', col.className || ''].join(' ')}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}

              {paged.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-slate-500"
                    colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                  >
                    No results
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-4 text-sm text-slate-600">
          <div>
            Page <span className="font-semibold text-slate-900">{safePageIndex + 1}</span> of{' '}
            <span className="font-semibold text-slate-900">{pageCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-10 w-10 grid place-items-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex(Math.max(0, safePageIndex - 1))}
              aria-label="Previous page"
            >
              ‹
            </button>
            <button
              className="h-10 w-10 grid place-items-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              disabled={safePageIndex >= pageCount - 1}
              onClick={() => setPageIndex(Math.min(pageCount - 1, safePageIndex + 1))}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


