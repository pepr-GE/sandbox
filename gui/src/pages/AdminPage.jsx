import React, { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, deactivateUser, getRoles, createRole, deleteRole } from '../api/users'
import { useI18n } from '../context/I18nContext'
import SortableTh from '../components/SortableTh'
import { useSortableTable } from '../hooks/useSortableTable'

function UserModal({ user, roles, onClose, onSaved, t }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    active: user?.active ?? true,
    roles: user?.roles ? [...user.roles] : [],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (roleName) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(roleName) ? f.roles.filter((r) => r !== roleName) : [...f.roles, roleName],
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
      if (isEdit) { await updateUser(user.id, payload) } else { await createUser(payload) }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.fieldErrors ?? {}).join(', ') || t.errSaveUser)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? t.editUserTitle(user.username) : t.createUserTitle}</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isEdit && (
            <div className="form-group">
              <label>{t.usernameLabel} *</label>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required minLength={3} />
            </div>
          )}
          <div className="form-group">
            <label>{t.emailLabel} *</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>{isEdit ? t.passwordEditLabel : t.passwordLabel + ' *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} {...(!isEdit ? { required: true, minLength: 6 } : {})} />
          </div>
          <div className="form-group">
            <label>{t.rolesLabel}</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {roles.map((r) => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={form.roles.includes(r.name)} onChange={() => toggle(r.name)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          {isEdit && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                {t.activeLabel}
              </label>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t.saving : t.save}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoleModal({ onClose, onSaved, t }) {
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
      setError(err.response?.data?.message || t.errCreateRole)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{t.createRoleTitle}</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.roleNameLabel} *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} placeholder={t.roleNamePlaceholder} />
          </div>
          <div className="form-group">
            <label>{t.roleDescLabel}</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder={t.roleDescPlaceholder} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t.creating : t.create}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { t: tAll } = useI18n()
  const t = tAll.admin
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [msg, setMsg] = useState(null)

  const [uColW, setUColW] = useState({ username: 150, email: 200, roles: 180, active: 90, createdAt: 130, actions: 140 })
  const setUW = (key, w) => setUColW((prev) => ({ ...prev, [key]: w }))
  const [rColW, setRColW] = useState({ name: 150, description: 300, actions: 100 })
  const setRW = (key, w) => setRColW((prev) => ({ ...prev, [key]: w }))

  const { sorted: sortedUsers, sortKey: uSortKey, sortDir: uSortDir, toggleSort: uToggle } = useSortableTable(users, 'username', 'asc')
  const { sorted: sortedRoles, sortKey: rSortKey, sortDir: rSortDir, toggleSort: rToggle } = useSortableTable(roles, 'name', 'asc')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u.data)
      setRoles(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const flash = (m, type = 'success') => { setMsg({ text: m, type }); setTimeout(() => setMsg(null), 3000) }

  const handleDeactivate = async (u) => {
    if (!window.confirm(t.confirmDeactivate(u.username))) return
    try { await deactivateUser(u.id); flash(t.userSaved); loadAll() }
    catch (e) { flash(t.errDeactivate, 'error') }
  }

  const handleDeleteRole = async (r) => {
    if (!window.confirm(t.confirmDeleteRole(r.name))) return
    try { await deleteRole(r.id); flash(t.roleCreated); loadAll() }
    catch (e) { flash(t.errDeleteRole(), 'error') }
  }

  const tabStyle = (tv) => ({
    padding: '9px 22px', borderRadius: '6px 6px 0 0', border: 'none',
    background: tab === tv ? 'var(--bg2)' : 'transparent',
    color: tab === tv ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: tab === tv ? 600 : 400,
    borderBottom: tab === tv ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit',
  })

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div className="page-title">{t.title}</div>
      {msg && <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>{t.usersTab}</button>
        <button style={tabStyle('roles')} onClick={() => setTab('roles')}>{t.rolesTab}</button>
      </div>

      {tab === 'users' && (
        <>
          <div className="flex-between mb-16">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{t.userCount(users.length)}</span>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>{t.newUser}</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {loading ? <div className="spinner" /> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <SortableTh label={t.colUsername} colKey="username"  sortKey={uSortKey} sortDir={uSortDir} onSort={uToggle} width={uColW.username}  onResize={(w) => setUW('username', w)} />
                      <SortableTh label={t.colEmail}    colKey="email"     sortKey={uSortKey} sortDir={uSortDir} onSort={uToggle} width={uColW.email}     onResize={(w) => setUW('email', w)} />
                      <SortableTh label={t.colRoles}    colKey="roles"     sortKey={uSortKey} sortDir={uSortDir} onSort={uToggle} width={uColW.roles}     onResize={(w) => setUW('roles', w)} />
                      <SortableTh label={t.colStatus}   colKey="active"    sortKey={uSortKey} sortDir={uSortDir} onSort={uToggle} width={uColW.active}    onResize={(w) => setUW('active', w)} />
                      <SortableTh label={t.colCreated}  colKey="createdAt" sortKey={uSortKey} sortDir={uSortDir} onSort={uToggle} width={uColW.createdAt} onResize={(w) => setUW('createdAt', w)} />
                      <SortableTh label={t.colActions}  width={uColW.actions} onResize={(w) => setUW('actions', w)} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.username}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{[...u.roles].sort().map((r) => <span key={r} className="badge badge-blue">{r}</span>)}</div></td>
                        <td>{u.active ? <span className="badge badge-green">{t.active}</span> : <span className="badge badge-red">{t.inactive}</span>}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-secondary btn-sm" onClick={() => setEditUser(u)}>{t.edit}</button>
                            {u.active && <button className="btn-danger btn-sm" onClick={() => handleDeactivate(u)}>{t.deactivate}</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'roles' && (
        <>
          <div className="flex-between mb-16">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{t.roleCount(roles.length)}</span>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateRole(true)}>{t.newRole}</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {loading ? <div className="spinner" /> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <SortableTh label={t.colName}    colKey="name"        sortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} width={rColW.name}        onResize={(w) => setRW('name', w)} />
                      <SortableTh label={t.colDesc}    colKey="description" sortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} width={rColW.description}  onResize={(w) => setRW('description', w)} />
                      <SortableTh label={t.colActions} width={rColW.actions} onResize={(w) => setRW('actions', w)} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRoles.map((r) => (
                      <tr key={r.id}>
                        <td><span className="badge badge-blue">{r.name}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.description || '-'}</td>
                        <td><button className="btn-danger btn-sm" onClick={() => handleDeleteRole(r)}>{t.deleteRole}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {(showCreateUser || editUser) && (
        <UserModal user={editUser} roles={roles} t={t}
          onClose={() => { setShowCreateUser(false); setEditUser(null) }}
          onSaved={() => { setShowCreateUser(false); setEditUser(null); flash(t.userSaved); loadAll() }}
        />
      )}
      {showCreateRole && (
        <RoleModal t={t} onClose={() => setShowCreateRole(false)} onSaved={() => { setShowCreateRole(false); flash(t.roleCreated); loadAll() }} />
      )}
    </div>
  )
}
