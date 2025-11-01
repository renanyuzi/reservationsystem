// 東京タイムゾーン対応の日付ユーティリティ

/**
 * Dateオブジェクトを "YYYY-MM-DD" 形式の文字列に変換（東京時間）
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * "YYYY-MM-DD" 形式の文字列をDateオブジェクトに変換（東京時間）
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 月の最初の日を取得
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の最後の日を取得
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * カレンダー表示用の日付配列を生成（前後の月の日付を含む）
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDayOfWeek = firstDay.getDay(); // 0 = 日曜日
  const daysInMonth = lastDay.getDate();
  
  const days: Date[] = [];
  
  // 前月の日付を追加
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }
  
  // 当月の日付を追加
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // 次月の日付を追加（6週分になるまで）
  const remainingDays = 42 - days.length; // 6週 x 7日 = 42日
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

/**
 * 2つの日付が同じ日かチェック
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateToLocalString(date1) === formatDateToLocalString(date2);
}

/**
 * 指定された日付が指定された月かチェック
 */
export function isSameMonth(date: Date, month: number): boolean {
  return date.getMonth() === month;
}

/**
 * 時間選択用の配列を生成（15分単位、9:00～20:00）
 */
export function getTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 20 && minute > 0) break; // 20:00まで
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      times.push(timeStr);
    }
  }
  return times;
}

/**
 * 所要時間選択用の配列を生成（15分単位）
 */
export function getDurationOptions(): number[] {
  return [15, 30, 45, 60, 75, 90, 105, 120];
}

/**
 * 月の名前を取得（日本語）
 */
export function getMonthName(month: number): string {
  return `${month + 1}月`;
}

/**
 * 曜日名を取得（日本語）
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayOfWeek];
}
