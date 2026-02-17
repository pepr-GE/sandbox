import client from './client'

export const getUsers = () => client.get('/admin/users')
export const getUserById = (id) => client.get(`/admin/users/${id}`)
export const createUser = (data) => client.post('/admin/users', data)
export const updateUser = (id, data) => client.put(`/admin/users/${id}`, data)
export const deactivateUser = (id) => client.patch(`/admin/users/${id}/deactivate`)

export const getRoles = () => client.get('/admin/roles')
export const createRole = (data) => client.post('/admin/roles', data)
export const deleteRole = (id) => client.delete(`/admin/roles/${id}`)
