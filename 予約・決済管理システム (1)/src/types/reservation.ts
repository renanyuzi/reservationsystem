// 予約データの型定義
export interface Reservation {
  id: string;
  date: string;        // "2025-10-26" 形式
  time: string;        // "10:00" 形式
  duration: number;    // 分単位 (15, 30, 45, 60, 75, 90, 105, 120)
  parentName: string;
  childName: string;
  childAge: number;    // 子供の年齢（ヶ月単位）
  moldCount: 1 | 2 | 4;
  paymentStatus: 'paid' | 'unpaid';
  location: string;
  staff: string;
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
