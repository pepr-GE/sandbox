import { useState, useMemo } from 'react'

/**
 * useSortableTable – client-side sorting for an array of objects.
 *
 * @param {Array}  data       – original array
 * @param {string} defaultKey – column key to sort by initially ('' = none)
 * @param {string} defaultDir – 'asc' | 'desc'
 * @returns {{ sorted, sortKey, sortDir, toggleSort }}
 */
export function useSortableTable(data, defaultKey = '', defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !data?.length) return data ?? []
    return [...data].sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (av == null) av = ''
      if (bv == null) bv = ''
      if (typeof av === 'boolean') av = av ? 1 : 0
      if (typeof bv === 'boolean') bv = bv ? 1 : 0
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}
