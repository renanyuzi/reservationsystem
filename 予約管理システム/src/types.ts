// 共通型定義

export interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  customerId: string;
  moldCount: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  reservationStatus: 'standby' | 'confirmed';
  location: string;
  staffInCharge: string;
  note: string;
  engravingName?: string;
  engravingDate?: string;
  fontStyle?: 'mincho' | 'gothic' | 'cursive';
  deliveryStatus?: 'pending' | 'shipped' | 'completed';
  deliveryMethod?: 'studio' | 'shipping';
  shippingAddress?: string;
  scheduledDeliveryDate?: string;
  actualDeliveryDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // 顧客情報（結合時のみ）
  customer?: Customer;
  
  // 後方互換性のため保持（deprecated - 将来削除予定）
  parentName?: string;
  childName?: string;
  age?: number;
  ageMonths?: number;
  phoneNumber?: string;
  address?: string;
  lineUrl?: string;
}

export interface Customer {
  customerId: string;
  parentName: string;
  childName: string;
  age?: number;
  ageMonths?: number;
  phoneNumber: string;
  address?: string;
  lineUrl: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  reservationStatus: 'standby' | 'confirmed' | 'none';
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  password?: string;
}

export interface Incentive {
  staff: string;
  date: string;
  count: number;
  amount: number;
}

export interface UserProfile {
  userId: string;
  role: 'admin' | 'staff';
  name: string;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'pending';
export type ReservationStatus = 'standby' | 'confirmed' | 'none';
export type DeliveryStatus = 'pending' | 'shipped' | 'completed';
export type FontStyle = 'mincho' | 'gothic' | 'cursive';
export type DeliveryMethod = 'studio' | 'shipping';

// タスク型
export interface Task {
  id: string;
  type: 'payment_followup' | 'delivery_reminder' | 'confirmation_needed' | 'delivery_overdue';
  reservationId: string;
  customerId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
  createdAt: string;
}

// タイムラインイベント型
export interface TimelineEvent {
  id: string;
  reservationId: string;
  type: 'created' | 'confirmed' | 'payment_received' | 'production_started' | 'shipped' | 'completed';
  title: string;
  description?: string;
  timestamp: string;
  performedBy?: string;
}
