import React, { useState, useEffect } from 'react'
import {
  getUsers, createUser, updateUser, deactivateUser,
  getRoles, createRole, deleteRole,
} from '../api/users'

function UserModal({ user, roles, onClose, onSaved }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    active: user?.active ?? true,
    roles: user?.roles ?? [],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (roleName) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(roleName)
        ? f.roles.filter((r) => r !== roleName)
        : [...f.roles, roleName],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        email: form.email,
        active: form.active,
        roles: form.roles,
        ...(form.password ? { password: form.password } : {}),
        ...(!isEdit ? { username: form.username } : {}),
      }
      if (isEdit) {
        await updateUser(user.id, payload)
      } else {
        await createUser(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message ||
        Object.values(err.response?.data?.fieldErrors ?? {}).join(', ') ||
        'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? `Edit User: ${user.username}` : 'Create User'}</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isEdit && (
            <div className="form-group">
              <label>Username *</label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required minLength={3}
              />
            </div>
          )}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              {...(!isEdit ? { required: true, minLength: 6 } : {})}
            />
          </div>
          <div className="form-group">
            <label>Roles</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {roles.map((r) => (
                <label key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', color: 'var(--text)',
                }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={form.roles.includes(r.name)}
                    onChange={() => toggle(r.name)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          {isEdit && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active
              </label>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoleModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createRole(form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Create Role</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required minLength={2}
              placeholder="e.g. OPERATOR"
            />
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
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [msg, setMsg] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u.data)
      setRoles(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const flash = (m, type = 'success') => {
    setMsg({ text: m, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate user "${u.username}"?`)) return
    try {
      await deactivateUser(u.id)
      flash(`User ${u.username} deactivated`)
      loadAll()
    } catch (e) {
      flash('Failed to deactivate user', 'error')
    }
  }

  const handleDeleteRole = async (r) => {
    if (!window.confirm(`Delete role "${r.name}"?`)) return
    try {
      await deleteRole(r.id)
      flash(`Role ${r.name} deleted`)
      loadAll()
    } catch (e) {
      flash(e.response?.data?.message || 'Failed to delete role', 'error')
    }
  }

  const tabStyle = (t) => ({
    padding: '8px 20px',
    borderRadius: '6px 6px 0 0',
    border: 'none',
    background: tab === t ? 'var(--bg2)' : 'transparent',
    color: tab === t ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: tab === t ? 600 : 400,
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: 14,
  })

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div className="page-title">Administration</div>

      {msg && (
        <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>Users</button>
        <button style={tabStyle('roles')} onClick={() => setTab('roles')}>Roles</button>
      </div>

      {tab === 'users' && (
        <>
          <div className="flex-between mb-16">
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{users.length} user{users.length !== 1 ? 's' : ''}</span>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>+ New User</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {loading ? <div className="spinner" /> : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[...u.roles].sort().map((r) => (
                            <span key={r} className="badge badge-blue">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {u.active
                          ? <span className="badge badge-green">active</span>
                          : <span className="badge badge-red">inactive</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                          {u.active && (
                            <button className="btn-danger btn-sm" onClick={() => handleDeactivate(u)}>Off</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'roles' && (
        <>
          <div className="flex-between mb-16">
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{roles.length} role{roles.length !== 1 ? 's' : ''}</span>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateRole(true)}>+ New Role</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {loading ? <div className="spinner" /> : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td><span className="badge badge-blue">{r.name}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.description || '-'}</td>
                      <td>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteRole(r)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {(showCreateUser || editUser) && (
        <UserModal
          user={editUser}
          roles={roles}
          onClose={() => { setShowCreateUser(false); setEditUser(null) }}
          onSaved={() => {
            setShowCreateUser(false)
            setEditUser(null)
            flash('User saved successfully')
            loadAll()
          }}
        />
      )}

      {showCreateRole && (
        <RoleModal
          onClose={() => setShowCreateRole(false)}
          onSaved={() => {
            setShowCreateRole(false)
            flash('Role created successfully')
            loadAll()
          }}
        />
      )}
    </div>
  )
}
