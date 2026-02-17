import client from './client'

export const getMessages = (params) =>
  client.get('/messages', { params })

export const getMessageById = (id) =>
  client.get(`/messages/${id}`)

export const getDistinctTopics = () =>
  client.get('/messages/topics')
