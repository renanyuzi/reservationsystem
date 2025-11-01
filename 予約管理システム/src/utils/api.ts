import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6f5ce90a`;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API呼び出しに失敗しました');
  }
  
  return data;
}

export const api = {
  // 初期化
  init: () => apiCall('/init'),
  
  // 認証
  login: (staffId: string, password: string) =>
    apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ staffId, password }),
    }),
  
  // ユーザー管理
  getUsers: () => apiCall('/users'),
  createUser: (user: { name: string; staffId: string; password: string; role: string }) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  updateUser: (oldStaffId: string, user: { name: string; staffId: string; password?: string; role: string }) =>
    apiCall(`/users/${oldStaffId}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  deleteUser: (staffId: string) =>
    apiCall(`/users/${staffId}`, {
      method: 'DELETE',
    }),
  
  // プロフィール
  updateProfile: (data: { staffId: string; name: string; currentPassword?: string; newPassword?: string }) =>
    apiCall('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 予約
  getReservations: () => apiCall('/reservations'),
  createReservation: (reservation: any) =>
    apiCall('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    }),
  updateReservation: (id: string, data: any) =>
    apiCall(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteReservation: (id: string) =>
    apiCall(`/reservations/${id}`, {
      method: 'DELETE',
    }),
  
  // 拠点
  getLocations: () => apiCall('/locations'),
  addLocation: (name: string) =>
    apiCall('/locations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteLocation: (name: string) =>
    apiCall(`/locations/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
  
  // スタッフマスター
  getStaff: () => apiCall('/staff'),
  addStaff: (name: string) =>
    apiCall('/staff', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteStaff: (name: string) =>
    apiCall(`/staff/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
  
  // 顧客管理
  getCustomers: () => apiCall('/customers'),
  createCustomer: (customer: any) =>
    apiCall('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),
  updateCustomer: (id: string, data: any) =>
    apiCall(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: string) =>
    apiCall(`/customers/${id}`, {
      method: 'DELETE',
    }),
  
  // データマイグレーション
  migrateReservationsToCustomers: () =>
    apiCall('/migrate/reservations-to-customers', {
      method: 'POST',
    }),
};
