// 予約データの型定義
export interface Reservation {
  id: string;
  date: string;        // "2025-10-26" 形式
  time: string;        // "10:00" 形式
  duration: number;    // 分単位 (15, 30, 45, 60, 75, 90, 105, 120)
  parentName: string;
  childName: string;
  childAge: number;    // 子供の年齢（ヶ月単位）
  customerNumber: string; // 顧客番号
  moldCount: 1 | 2 | 4;
  paymentStatus: 'paid' | 'unpaid';
  status: 'confirmed' | 'standby'; // 確定 or 待機中
  location: string;
  staff: string;
  createdBy: string;   // 予約を作成したスタッフのID
  notes: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'staff' | 'manager';
  incentiveRate?: number; // インセンティブ率（%）
}

export interface IncentiveRecord {
  staffId: string;
  staffName: string;
  month: string; // "2025-10"形式
  reservations: {
    id: string;
    date: string;
    customerName: string;
    amount: number;
  }[];
  totalReservations: number;
  totalIncentive: number;
}
