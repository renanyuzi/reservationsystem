import { Reservation } from '../types/reservation';
import { ReservationCard } from './ReservationCard';
import { formatDateToLocalString } from '../utils/dateUtils';
import { AlertCircle, Edit } from 'lucide-react';
import { Button } from './ui/button';

interface ReservationListProps {
  selectedDate: Date | null;
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onPaymentStatusToggle: (id: string) => void;
  editMode?: boolean;
  onToggleEditMode?: () => void;
}

export function ReservationList({
  selectedDate,
  reservations,
  onReservationClick,
  onPaymentStatusToggle,
  editMode = false,
  onToggleEditMode,
}: ReservationListProps) {
  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p>日付を選択してください</p>
      </div>
    );
  }

  const dateStr = formatDateToLocalString(selectedDate);
  const dayReservations = reservations
    .filter((r) => r.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][selectedDate.getDay()];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">
              {year}年{month}月{day}日（{dayOfWeek}）
            </h2>
            <p className="text-sm text-gray-600 mt-1">{dayReservations.length}件の予約</p>
          </div>
          {onToggleEditMode && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleEditMode}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? '編集中' : '編集'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
        {dayReservations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>予約がありません</p>
          </div>
        ) : (
          dayReservations.map((reservation) => (
            <div key={reservation.id} className="relative">
              <ReservationCard
                reservation={reservation}
                onClick={() => onReservationClick(reservation)}
                onPaymentStatusToggle={onPaymentStatusToggle}
              />
              {editMode && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    タップして編集
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
