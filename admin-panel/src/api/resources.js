import { apiClient } from './client';

export const authApi = {
  me: () => apiClient.get('/users/me'),
};

export const medicinesApi = {
  list: ({ page, limit, search, category, pharmacy }) =>
    apiClient.get('/medicines', { page, limit, search, category, pharmacy }),
  getById: (id) => apiClient.get(`/medicines/${id}`),
  create: (payload) => apiClient.post('/medicines', payload),
  update: (id, payload) => apiClient.patch(`/medicines/${id}`, payload),
  remove: (id) => apiClient.delete(`/medicines/${id}`),
};

export const categoriesApi = {
  list: () => apiClient.get('/categories', { all: 'true' }),
  create: (payload) => apiClient.post('/categories', payload),
  update: (id, payload) => apiClient.patch(`/categories/${id}`, payload),
  remove: (id) => apiClient.delete(`/categories/${id}`),
};

export const pharmaciesApi = {
  list: () => apiClient.get('/pharmacies', { all: 'true' }),
};

export const ordersApi = {
  list: ({ page, limit, status }) => apiClient.get('/orders', { page, limit, status }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => apiClient.patch(`/orders/${id}/cancel`),
};

export const deliveriesApi = {
  getByOrderId: (orderId) => apiClient.get(`/deliveries/order/${orderId}`),
  assign: (id, riderId) => apiClient.patch(`/deliveries/${id}/assign`, { riderId }),
};

export const usersApi = {
  list: ({ page, limit, role }) => apiClient.get('/users', { page, limit, role }),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (payload) => apiClient.post('/users', payload),
  adminUpdate: (id, payload) => apiClient.patch(`/users/${id}`, payload),
};

export const paymentsApi = {
  list: ({ page, limit, status, method }) => apiClient.get('/payments', { page, limit, status, method }),
  confirm: (id) => apiClient.post(`/payments/${id}/confirm`),
};

export const reportsApi = {
  dashboard: () => apiClient.get('/reports/dashboard'),
};

export const auditLogsApi = {
  list: ({ page, limit, action, resourceType, actor, from, to }) =>
    apiClient.get('/audit-logs', { page, limit, action, resourceType, actor, from, to }),
};
