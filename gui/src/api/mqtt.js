import client from './client'

export const getBrokerStatus = () => client.get('/mqtt/status')
export const getSubscriptions = () => client.get('/mqtt/subscriptions')
export const createSubscription = (data) => client.post('/mqtt/subscriptions', data)
export const toggleSubscription = (id, active) =>
  client.patch(`/mqtt/subscriptions/${id}/toggle`, null, { params: { active } })
export const deleteSubscription = (id) => client.delete(`/mqtt/subscriptions/${id}`)
export const publishMessage = (data) => client.post('/mqtt/publish', data)
