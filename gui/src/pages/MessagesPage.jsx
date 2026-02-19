import React, { useState, useEffect, useCallback } from 'react'
import { getMessages, getDistinctTopics, getMessageById } from '../api/messages'
import { publishMessage } from '../api/mqtt'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import SortableTh from '../components/SortableTh'
import { useSortableTable } from '../hooks/useSortableTable'

const lastPublishForm = { topic: '', payload: '', qos: 0, retained: false }

function MessageDetailModal({ id, onClose, t }) {
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    getMessageById(id).then((r) => setMsg(r.data)).catch(() => onClose())
  }, [id])
  if (!msg) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{t.detailTitle}</div>
        <table style={{ marginBottom: 0 }}>
          <tbody>
            <tr><td style={{ color: 'var(--text-muted)', width: 120 }}>ID</td><td>{msg.id}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>{t.colTopic}</td><td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{msg.topic}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>{t.colQos}</td><td>{msg.qos}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>{t.retained}</td><td>{msg.retained ? t.yes : t.no}</td></tr>
            <tr><td style={{ color: 'var(--text-muted)' }}>{t.colReceivedAt}</td><td>{new Date(msg.receivedAt).toLocaleString()}</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <label>{t.payload}</label>
          <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, overflow: 'auto', maxHeight: 300, fontFamily: 'monospace', fontSize: '0.79rem', color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {(() => { try { return JSON.stringify(JSON.parse(msg.payload), null, 2) } catch { return msg.payload } })()}
          </pre>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}

function PublishModal({ onClose, t }) {
  const [form, setForm] = useState({ ...lastPublishForm })
  const [error, setError] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [sending, setSending] = useState(false)
  const tSub = t._sub

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await publishMessage({ ...form, qos: Number(form.qos) })
      Object.assign(lastPublishForm, form)
      setSuccessCount((c) => c + 1)
    } catch (err) {
      setError(err.response?.data?.message || tSub.errPublish)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{tSub.publishTitle}</div>
        {error && <div className="error-msg">{error}</div>}
        {successCount > 0 && <div className="success-msg">{tSub.publishSuccess}{successCount > 1 ? ` (x${successCount})` : ''}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{tSub.topic} *</label>
            <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder={tSub.topicPlaceholder} required />
          </div>
          <div className="form-group">
            <label>{tSub.payloadLabel} *</label>
            <textarea value={form.payload} onChange={(e) => setForm((f) => ({ ...f, payload: e.target.value }))} placeholder={tSub.payloadPlaceholder} rows={5} required />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label>{tSub.qos}</label>
              <select value={form.qos} onChange={(e) => setForm((f) => ({ ...f, qos: e.target.value }))}>
                <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.retained} onChange={(e) => setForm((f) => ({ ...f, retained: e.target.checked }))} />
                {tSub.retained}
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.close}</button>
            <button type="submit" className="btn-primary" disabled={sending}>{sending ? tSub.publishing : tSub.publishBtn2}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { isAdmin } = useAuth()
  const { t: tAll } = useI18n()
  const t = { ...tAll.messages, _sub: tAll.subscriptions }

  const [messages, setMessages] = useState([])
  const [topics, setTopics] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showPublish, setShowPublish] = useState(false)
  const [filter, setFilter] = useState({ topic: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const pageSize = 50

  const [colW, setColW] = useState({ id: 65, topic: 220, payload: 280, qos: 60, retained: 80, receivedAt: 175, actions: 130 })
  const setW = (key, w) => setColW((prev) => ({ ...prev, [key]: w }))

  const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(messages, 'receivedAt', 'desc')

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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => { getDistinctTopics().then((r) => setTopics(r.data)).catch(() => {}) }, [])

  const totalPages = Math.ceil(total / pageSize)
  const handleFilterChange = (key, val) => { setFilter((f) => ({ ...f, [key]: val })); setPage(0) }

  return (
    <div style={{ padding: 24, maxWidth: 1450 }}>
      <div className="flex-between mb-16">
        <div className="page-title">{t.title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin() && <button className="btn-secondary" onClick={() => setShowPublish(true)}>{t.publish}</button>}
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>{t.refresh}</button>
        </div>
      </div>

      <div className="card mb-16">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label>{t.filterByTopic}</label>
            <input type="text" placeholder="e.g. sensors/temperature" value={filter.topic} onChange={(e) => handleFilterChange('topic', e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label>{t.from}</label>
            <input type="datetime-local" value={filter.from} onChange={(e) => handleFilterChange('from', e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label>{t.to}</label>
            <input type="datetime-local" value={filter.to} onChange={(e) => handleFilterChange('to', e.target.value)} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label>&nbsp;</label>
            <button className="btn-secondary" onClick={() => { setFilter({ topic: '', from: '', to: '' }); setPage(0) }}>{t.clear}</button>
          </div>
        </div>
        {topics.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.79rem', alignSelf: 'center' }}>{t.quickFilter}</span>
            {topics.slice(0, 20).map((tp) => (
              <button key={tp} className="btn-secondary btn-sm" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} onClick={() => handleFilterChange('topic', tp)}>{tp}</button>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t.found(total)}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <SortableTh label={t.colId}         colKey="id"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.id}         onResize={(w) => setW('id', w)} />
                    <SortableTh label={t.colTopic}      colKey="topic"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.topic}      onResize={(w) => setW('topic', w)} />
                    <SortableTh label={t.colPayload}    colKey="payload"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.payload}    onResize={(w) => setW('payload', w)} />
                    <SortableTh label={t.colQos}        colKey="qos"        sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.qos}        onResize={(w) => setW('qos', w)} />
                    <SortableTh label={t.colRetained}   colKey="retained"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.retained}   onResize={(w) => setW('retained', w)} />
                    <SortableTh label={t.colReceivedAt} colKey="receivedAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.receivedAt} onResize={(w) => setW('receivedAt', w)} />
                    <SortableTh label="" width={colW.actions} onResize={(w) => setW('actions', w)} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36 }}>{t.noMessages}</td></tr>
                  ) : sorted.map((m) => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{m.id}</td>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>{m.topic}</span></td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.79rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.payload}</span></td>
                      <td>{m.qos}</td>
                      <td>{m.retained ? <span className="badge badge-orange">yes</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>no</span>}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(m.receivedAt).toLocaleString()}</td>
                      <td><button className="btn-secondary btn-sm" onClick={() => setSelectedId(m.id)}>{t.view}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination" style={{ padding: '12px 16px' }}>
                <button className="btn-secondary btn-sm" onClick={() => setPage(0)} disabled={page === 0}>Â«</button>
                <button className="btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>â¹</button>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0 8px' }}>Page {page + 1} / {totalPages}</span>
                <button className="btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>âº</button>
                <button className="btn-secondary btn-sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>Â»</button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && <MessageDetailModal id={selectedId} t={t} onClose={() => setSelectedId(null)} />}
      {showPublish && <PublishModal t={t} onClose={() => setShowPublish(false)} />}
    </div>
  )
}
