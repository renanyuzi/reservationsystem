import { projectId, publicAnonKey } from './supabase/info';
import { Reservation, Location, Staff } from '../types/reservation';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a759794`;

// トークンを取得
function getAuthToken(): string | null {
  return sessionStorage.getItem('authToken');
}

// 認証済みリクエスト用のヘッダーを取得（JWTトークンを使用）
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// 認証前リクエスト用のヘッダーを取得（匿名キーを使用）
function getPublicHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    'apikey': publicAnonKey,
  };
}

// ========================================
// 認証API
// ========================================

export async function login(username: string, password: string): Promise<{ user: any; token: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getPublicHeaders(), // 匿名キーを含むヘッダーを使用
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // トークンを保存
    if (data.token) {
      sessionStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export function logout(): void {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('currentUser');
}

// ========================================
// 予約管理API
// ========================================

export async function fetchReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch(`${BASE_URL}/reservations`, { 
      headers: getHeaders() 
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch reservations');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch reservations');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

// エイリアス: 後方互換性のため
export const getReservations = fetchReservations;

export async function createReservation(reservation: Reservation): Promise<Reservation> {
  try {
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reservation }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create reservation');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create reservation');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

export async function updateReservation(id: string, reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
  try {
    const response = await fetch(`${BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reservation }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update reservation');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update reservation');
    }
    return data.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}

export async function deleteReservation(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete reservation');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete reservation');
    }
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

export async function togglePaymentStatus(id: string): Promise<Reservation> {
  try {
    const response = await fetch(`${BASE_URL}/reservations/${id}/payment`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to toggle payment status');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to toggle payment status');
    }
    return data.data;
  } catch (error) {
    console.error('Error toggling payment status:', error);
    throw error;
  }
}

// ========================================
// 拠点管理API
// ========================================

export async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch(`${BASE_URL}/locations`, { 
      headers: getHeaders() 
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch locations');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch locations');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

export async function createLocation(location: Location): Promise<Location> {
  try {
    const response = await fetch(`${BASE_URL}/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ location }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create location');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create location');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/locations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete location');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete location');
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

// ========================================
// スタッフ管理API
// ========================================

export async function fetchStaff(): Promise<Staff[]> {
  try {
    const response = await fetch(`${BASE_URL}/staff`, { 
      headers: getHeaders() 
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch staff');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch staff');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
}

export async function createStaff(staff: Staff): Promise<Staff> {
  try {
    const response = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ staff }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create staff');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create staff');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
}

export async function deleteStaff(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete staff');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete staff');
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
}

// ========================================
// ユーザー管理API
// ========================================

export async function fetchUsers(): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, { 
      headers: getHeaders() 
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function createUser(user: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id: string, updates: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ========================================
// セットアップAPI
// ========================================

export async function setupInitialData(): Promise<void> {
  try {
    console.log('🔧 セットアップAPIを呼び出しています...');
    const response = await fetch(`${BASE_URL}/setup`, {
      method: 'POST',
      headers: getPublicHeaders(), // 匿名キーを含むヘッダーを使用
    });
    
    const data = await response.json();
    console.log('📦 セットアップAPI応答:', data);
    
    if (!response.ok) {
      console.error('❌ セットアップAPIエラー:', data);
      throw new Error(data.error || data.details || 'Failed to setup initial data');
    }
    
    if (!data.success && !data.skipped) {
      console.error('❌ セットアップ失敗:', data);
      throw new Error(data.error || data.details || 'Failed to setup initial data');
    }
    
    console.log('✅ セットアップ完了:', data.message || 'Success');
  } catch (error) {
    console.error('❌ セットアップエラー:', error);
    throw error;
  }
}
