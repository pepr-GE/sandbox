import React, { useState, useEffect } from 'react'
import {
  getSubscriptions, createSubscription,
  toggleSubscription, deleteSubscription, publishMessage, getBrokerStatus,
} from '../api/mqtt'
import { useAuth } from '../context/AuthContext'

function AddSubscriptionModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ topicFilter: '', qos: 1, description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createSubscription({ ...form, qos: Number(form.qos) })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add Subscription</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topic Filter *</label>
            <input
              value={form.topicFilter}
              onChange={(e) => setForm((f) => ({ ...f, topicFilter: e.target.value }))}
              placeholder="e.g. sensors/# or home/+/temperature"
              required
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Supports MQTT wildcards: # (multi-level) and + (single-level)
            </div>
          </div>
          <div className="form-group">
            <label>QoS</label>
            <select value={form.qos} onChange={(e) => setForm((f) => ({ ...f, qos: e.target.value }))}>
              <option value={0}>0 - At most once</option>
              <option value={1}>1 - At least once</option>
              <option value={2}>2 - Exactly once</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PublishModal({ onClose }) {
  const [form, setForm] = useState({ topic: '', payload: '', qos: 0, retained: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await publishMessage({ ...form, qos: Number(form.qos) })
      setSuccess(true)
      setForm({ topic: '', payload: '', qos: 0, retained: false })
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Publish Message</div>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">Message published successfully</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topic *</label>
            <input
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. sensors/temperature"
              required
            />
          </div>
          <div className="form-group">
            <label>Payload *</label>
            <textarea
              value={form.payload}
              onChange={(e) => setForm((f) => ({ ...f, payload: e.target.value }))}
              placeholder='e.g. {"value": 23.5}'
              rows={5}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label>QoS</label>
              <select value={form.qos} onChange={(e) => setForm((f) => ({ ...f, qos: e.target.value }))}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.retained}
                  onChange={(e) => setForm((f) => ({ ...f, retained: e.target.checked }))}
                />
                Retained
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { isAdmin } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [connected, setConnected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [subs, status] = await Promise.all([getSubscriptions(), getBrokerStatus()])
      setSubscriptions(subs.data)
      setConnected(status.data.connected)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (sub) => {
    try {
      await toggleSubscription(sub.id, !sub.active)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete subscription for "${sub.topicFilter}"?`)) return
    try {
      await deleteSubscription(sub.id)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div className="flex-between mb-16">
        <div className="page-title">MQTT Subscriptions</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin() && (
            <>
              <button className="btn-secondary" onClick={() => setShowPublish(true)}>
                Publish Message
              </button>
              <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                + Add Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Broker status */}
      <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: connected === true ? 'var(--success)' : connected === false ? 'var(--danger)' : 'var(--text-muted)',
          display: 'inline-block', flexShrink: 0,
        }} />
        <span style={{ fontSize: 14 }}>
          Broker:{' '}
          <strong style={{ color: connected === true ? 'var(--success)' : 'var(--danger)' }}>
            {connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Unknown'}
          </strong>
        </span>
        <button className="btn-secondary btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>
          Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <table>
            <thead>
              <tr>
                <th>Topic Filter</th>
                <th style={{ width: 60 }}>QoS</th>
                <th style={{ width: 90 }}>Status</th>
                <th>Description</th>
                <th style={{ width: 140 }}>Created</th>
                {isAdmin() && <th style={{ width: 120 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    No subscriptions configured.{isAdmin() && ' Click "+ Add Subscription" to get started.'}
                  </td>
                </tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 13 }}>
                      {sub.topicFilter}
                    </span>
                  </td>
                  <td>{sub.qos}</td>
                  <td>
                    {sub.active
                      ? <span className="badge badge-green">active</span>
                      : <span className="badge badge-red">paused</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {sub.description || '-'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '-'}
                  </td>
                  {isAdmin() && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={sub.active ? 'btn-secondary btn-sm' : 'btn-success btn-sm'}
                          onClick={() => handleToggle(sub)}
                        >
                          {sub.active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(sub)}
                        >Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddSubscriptionModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </div>
  )
}
