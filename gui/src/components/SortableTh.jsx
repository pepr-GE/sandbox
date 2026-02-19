import React, { useRef, useCallback } from 'react'

/**
 * SortableTh – a <th> that supports:
 *   • click-to-sort (shows ↑ ↓ ↕ indicator)
 *   • drag-to-resize (drag the right edge)
 */
export default function SortableTh({ label, colKey, sortKey, sortDir, onSort, width, onResize, style = {}, children }) {
  const thRef = useRef(null)

  // ── Resize drag ────────────────────────────────────────────────────────────
  const startResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = thRef.current.offsetWidth

    const onMove = (mv) => {
      const newW = Math.max(50, startW + mv.clientX - startX)
      if (onResize) onResize(newW)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onResize])

  const isSorted = sortKey === colKey
  const indicator = isSorted ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  return (
    <th
      ref={thRef}
      style={{
        position: 'relative',
        width: width || undefined,
        minWidth: 50,
        userSelect: 'none',
        cursor: colKey ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onClick={colKey ? () => onSort(colKey) : undefined}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {label ?? children}
        {colKey && (
          <span style={{
            fontSize: '0.75em',
            opacity: isSorted ? 1 : 0.35,
            color: isSorted ? 'var(--accent)' : undefined,
          }}>
            {indicator}
          </span>
        )}
      </span>

      {/* Resize handle */}
      <span
        onMouseDown={startResize}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          zIndex: 1,
          background: 'transparent',
        }}
      />
    </th>
  )
}
