import { projectId, publicAnonKey } from './supabase/info';
import { Reservation, Location, Staff } from '../types/reservation';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a759794`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ========================================
// 予約管理API
// ========================================

export async function fetchReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch(`${BASE_URL}/reservations`, { headers });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch reservations');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

export async function createReservation(reservation: Reservation): Promise<Reservation> {
  try {
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reservation }),
    });
    const data = await response.json();
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
      headers,
      body: JSON.stringify({ reservation }),
    });
    const data = await response.json();
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
      headers,
    });
    const data = await response.json();
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
      headers,
    });
    const data = await response.json();
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
    const response = await fetch(`${BASE_URL}/locations`, { headers });
    const data = await response.json();
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
      headers,
      body: JSON.stringify({ location }),
    });
    const data = await response.json();
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
      headers,
    });
    const data = await response.json();
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
    const response = await fetch(`${BASE_URL}/staff`, { headers });
    const data = await response.json();
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
      headers,
      body: JSON.stringify({ staff }),
    });
    const data = await response.json();
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
      headers,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete staff');
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
}

// ========================================
// セットアップAPI
// ========================================

export async function setupInitialData(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/setup`, {
      method: 'POST',
      headers,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to setup initial data');
    }
    console.log('Initial data setup:', data);
  } catch (error) {
    console.error('Error setting up initial data:', error);
    throw error;
  }
}
