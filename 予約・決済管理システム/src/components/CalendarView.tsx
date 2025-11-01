import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Reservation } from '../types/reservation';
import {
  getCalendarDays,
  formatDateToLocalString,
  isSameDay,
  isSameMonth,
  getDayName,
  getMonthName,
} from '../utils/dateUtils';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  reservations: Reservation[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarView({
  currentDate,
  selectedDate,
  reservations,
  onDateSelect,
  onMonthChange,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = getCalendarDays(year, month);

  // 日付ごとの予約件数を計算
  const getReservationCount = (date: Date): number => {
    const dateStr = formatDateToLocalString(date);
    return reservations.filter((r) => r.date === dateStr).length;
  };

  // 予約件数に応じたバッジの色を取得
  const getBadgeColor = (count: number): string => {
    if (count === 0) return 'bg-gray-200 text-gray-600';
    if (count <= 2) return 'bg-blue-100 text-blue-700';
    if (count <= 4) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-500 text-white';
  };

  // 火曜日・水曜日かチェック
  const isTuesdayOrWednesday = (date: Date): boolean => {
    const day = date.getDay();
    return day === 2 || day === 3; // 2 = 火曜, 3 = 水曜
  };

  // 月の総予約件数を計算
  const monthTotalReservations = reservations.filter((r) => {
    const rDate = new Date(r.date);
    return rDate.getFullYear() === year && rDate.getMonth() === month;
  }).length;

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    onMonthChange(today);
    onDateSelect(today);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-900">
            {year}年{getMonthName(month)}
          </h2>
          <Badge variant="secondary" className="ml-2">
            {monthTotalReservations}件
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            今日
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div
            key={day}
            className={`text-center text-xs p-2 ${
              day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {getDayName(day)}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateStr = formatDateToLocalString(date);
          const count = getReservationCount(date);
          const isCurrentMonth = isSameMonth(date, month);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const isTueWed = isTuesdayOrWednesday(date);
          const dayOfWeek = date.getDay();

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                relative p-2 rounded-lg min-h-[80px] flex flex-col items-center justify-start
                transition-all active:scale-[0.98]
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isTueWed && isCurrentMonth ? 'bg-blue-50' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : 'hover:bg-gray-100'}
                ${isToday && !isSelected ? 'ring-2 ring-orange-400' : ''}
              `}
            >
              <span
                className={`text-sm mb-1 ${
                  dayOfWeek === 0 && isCurrentMonth
                    ? 'text-red-500'
                    : dayOfWeek === 6 && isCurrentMonth
                    ? 'text-blue-500'
                    : ''
                }`}
              >
                {date.getDate()}
              </span>
              {count > 0 && isCurrentMonth && (
                <Badge className={`text-xs px-1.5 py-0.5 ${getBadgeColor(count)}`}>
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
