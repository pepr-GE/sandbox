import React, { useState, useEffect } from 'react'
import {
  getSubscriptions, createSubscription, updateSubscription,
  toggleSubscription, deleteSubscription, publishMessage, getBrokerStatus,
} from '../api/mqtt'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import SortableTh from '../components/SortableTh'
import { useSortableTable } from '../hooks/useSortableTable'

const lastPublishForm = { topic: '', payload: '', qos: 0, retained: false }

function SubscriptionModal({ sub, onClose, onSaved, t }) {
  const isEdit = !!sub
  const [form, setForm] = useState({
    topicFilter: sub?.topicFilter ?? '',
    qos: sub?.qos ?? 1,
    description: sub?.description ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateSubscription(sub.id, { qos: Number(form.qos), description: form.description })
      } else {
        await createSubscription({ ...form, qos: Number(form.qos) })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? t.errUpdate : t.errCreate))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? t.editTitle : t.addTitle}</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.topicFilter} *</label>
            <input
              value={form.topicFilter}
              onChange={(e) => setForm((f) => ({ ...f, topicFilter: e.target.value }))}
              placeholder="e.g. sensors/#"
              required
              disabled={isEdit}
              style={isEdit ? { opacity: 0.6 } : {}}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.topicHint}</div>
          </div>
          <div className="form-group">
            <label>{t.qos}</label>
            <select value={form.qos} onChange={(e) => setForm((f) => ({ ...f, qos: e.target.value }))}>
              <option value={0}>0 - At most once</option>
              <option value={1}>1 - At least once</option>
              <option value={2}>2 - Exactly once</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t.description}</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t.descPlaceholder}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (isEdit ? t.saving : t.adding) : (isEdit ? t.save : t.add)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PublishModal({ onClose, t }) {
  const [form, setForm] = useState({ ...lastPublishForm })
  const [error, setError] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await publishMessage({ ...form, qos: Number(form.qos) })
      Object.assign(lastPublishForm, form)
      setSuccessCount((c) => c + 1)
    } catch (err) {
      setError(err.response?.data?.message || t.errPublish)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{t.publishTitle}</div>
        {error && <div className="error-msg">{error}</div>}
        {successCount > 0 && (
          <div className="success-msg">
            {t.publishSuccess}{successCount > 1 ? ` (x${successCount})` : ''}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.topic} *</label>
            <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder={t.topicPlaceholder} required />
          </div>
          <div className="form-group">
            <label>{t.payloadLabel} *</label>
            <textarea value={form.payload} onChange={(e) => setForm((f) => ({ ...f, payload: e.target.value }))} placeholder={t.payloadPlaceholder} rows={5} required />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label>{t.qos}</label>
              <select value={form.qos} onChange={(e) => setForm((f) => ({ ...f, qos: e.target.value }))}>
                <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.retained} onChange={(e) => setForm((f) => ({ ...f, retained: e.target.checked }))} />
                {t.retained}
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" disabled={sending}>{sending ? t.publishing : t.publishBtn2}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { isAdmin } = useAuth()
  const { t: tAll } = useI18n()
  const t = tAll.subscriptions
  const tBroker = tAll.broker
  const [subscriptions, setSubscriptions] = useState([])
  const [connected, setConnected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [showPublish, setShowPublish] = useState(false)
  const [colW, setColW] = useState({ topicFilter: 260, qos: 65, active: 100, description: 200, createdAt: 140, actions: 240 })
  const setW = (key, w) => setColW((prev) => ({ ...prev, [key]: w }))
  const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(subscriptions, 'topicFilter', 'asc')

  const load = async () => {
    setLoading(true)
    try {
      const [subs, status] = await Promise.all([getSubscriptions(), getBrokerStatus()])
      setSubscriptions(subs.data)
      setConnected(status.data.connected)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (sub) => {
    try { await toggleSubscription(sub.id, !sub.active); load() } catch (e) { console.error(e) }
  }

  const handleDelete = async (sub) => {
    if (!window.confirm(t.confirmDelete(sub.topicFilter))) return
    try { await deleteSubscription(sub.id); load() } catch (e) { console.error(e) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1300 }}>
      <div className="flex-between mb-16">
        <div className="page-title">{t.title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin() && (
            <>
              <button className="btn-secondary" onClick={() => setShowPublish(true)}>{t.publishBtn}</button>
              <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>{t.addBtn}</button>
            </>
          )}
        </div>
      </div>

      <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: connected === true ? 'var(--success)' : connected === false ? 'var(--danger)' : 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.93rem' }}>
          {tBroker.status}: <strong style={{ color: connected === true ? 'var(--success)' : 'var(--danger)' }}>
            {connected === true ? tBroker.connectedLabel : connected === false ? tBroker.disconnectedLabel : tBroker.unknown}
          </strong>
        </span>
        <button className="btn-secondary btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>{t.refresh}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <SortableTh label={t.colTopic}   colKey="topicFilter" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.topicFilter} onResize={(w) => setW('topicFilter', w)} />
                  <SortableTh label={t.colQos}     colKey="qos"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.qos}         onResize={(w) => setW('qos', w)} />
                  <SortableTh label={t.colStatus}  colKey="active"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.active}       onResize={(w) => setW('active', w)} />
                  <SortableTh label={t.colDesc}    colKey="description" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.description}  onResize={(w) => setW('description', w)} />
                  <SortableTh label={t.colCreated} colKey="createdAt"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} width={colW.createdAt}    onResize={(w) => setW('createdAt', w)} />
                  {isAdmin() && <SortableTh label={t.colActions} width={colW.actions} onResize={(w) => setW('actions', w)} />}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36 }}>{t.noSubs(isAdmin())}</td></tr>
                ) : sorted.map((sub) => (
                  <tr key={sub.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.86rem' }}>{sub.topicFilter}</span></td>
                    <td>{sub.qos}</td>
                    <td>{sub.active ? <span className="badge badge-green">{t.active}</span> : <span className="badge badge-red">{t.paused}</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{sub.description || '-'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '-'}</td>
                    {isAdmin() && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary btn-sm" onClick={() => setEditSub(sub)} style={{ minWidth: 60 }}>{t.edit}</button>
                          <button className={sub.active ? 'btn-secondary btn-sm' : 'btn-success btn-sm'} onClick={() => handleToggle(sub)} style={{ minWidth: 80 }}>{sub.active ? t.pause : t.resume}</button>
                          <button className="btn-danger btn-sm" onClick={() => handleDelete(sub)} style={{ minWidth: 70 }}>{t.del}</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editSub) && (
        <SubscriptionModal sub={editSub} t={t} onClose={() => { setShowAdd(false); setEditSub(null) }} onSaved={() => { setShowAdd(false); setEditSub(null); load() }} />
      )}
      {showPublish && <PublishModal t={t} onClose={() => setShowPublish(false)} />}
    </div>
  )
}
