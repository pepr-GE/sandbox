import React, { useState, useEffect, useCallback } from 'react'
import { getMessages, getDistinctTopics, getMessageById } from '../api/messages'

function MessageDetailModal({ id, onClose }) {
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    getMessageById(id).then((r) => setMsg(r.data)).catch(() => onClose())
  }, [id])

  if (!msg) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Message Details</div>
        <table style={{ marginBottom: 0 }}>
          <tbody>
            <tr><td style={{ color: 'var(--text-muted)', width: 110 }}>ID</td><td>{msg.id}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>Topic</td><td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{msg.topic}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>QoS</td><td>{msg.qos}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>Retained</td><td>{msg.retained ? 'Yes' : 'No'}</td></tr>
            <tr>
              <td style={{ color: 'var(--text-muted)' }}>Received</td>
              <td>{new Date(msg.receivedAt).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <label>Payload</label>
          <pre style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 12,
            overflow: 'auto',
            maxHeight: 300,
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {(() => {
              try { return JSON.stringify(JSON.parse(msg.payload), null, 2) }
              catch { return msg.payload }
            })()}
          </pre>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [topics, setTopics] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [filter, setFilter] = useState({ topic: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const pageSize = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: pageSize }
      if (filter.topic) params.topic = filter.topic
      if (filter.from) params.from = new Date(filter.from).toISOString()
      if (filter.to) params.to = new Date(filter.to).toISOString()

      const res = await getMessages(params)
      setMessages(res.data.content)
      setTotal(res.data.totalElements)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    getDistinctTopics().then((r) => setTopics(r.data)).catch(() => {})
  }, [])

  const totalPages = Math.ceil(total / pageSize)

  const handleFilterChange = (key, val) => {
    setFilter((f) => ({ ...f, [key]: val }))
    setPage(0)
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div className="flex-between mb-16">
        <div className="page-title">Received Messages</div>
        <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-16">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label>Filter by topic</label>
            <input
              type="text"
              placeholder="e.g. sensors/temperature"
              value={filter.topic}
              onChange={(e) => handleFilterChange('topic', e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label>From</label>
            <input
              type="datetime-local"
              value={filter.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label>To</label>
            <input
              type="datetime-local"
              value={filter.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label>&nbsp;</label>
            <button className="btn-secondary" onClick={() => {
              setFilter({ topic: '', from: '', to: '' })
              setPage(0)
            }}>Clear</button>
          </div>
        </div>
        {topics.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>Quick filter:</span>
            {topics.slice(0, 20).map((t) => (
              <button
                key={t}
                className="btn-secondary btn-sm"
                style={{ fontFamily: 'monospace', fontSize: 11 }}
                onClick={() => handleFilterChange('topic', t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              {total} message{total !== 1 ? 's' : ''} found
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th>Topic</th>
                    <th style={{ width: 320 }}>Payload (preview)</th>
                    <th style={{ width: 60 }}>QoS</th>
                    <th style={{ width: 60 }}>Retained</th>
                    <th style={{ width: 180 }}>Received At</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                        No messages found
                      </td>
                    </tr>
                  ) : messages.map((m) => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{m.id}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12 }}>
                          {m.topic}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}>
                          {m.payload}
                        </span>
                      </td>
                      <td>{m.qos}</td>
                      <td>
                        {m.retained
                          ? <span className="badge badge-orange">yes</span>
                          : <span className="badge" style={{ background: 'transparent', color: 'var(--text-muted)' }}>no</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(m.receivedAt).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => setSelectedId(m.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ padding: '12px 16px' }}>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                >«</button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >‹</button>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >›</button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >»</button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && (
        <MessageDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
