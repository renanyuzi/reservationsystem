import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Plus, Edit2, Check } from 'lucide-react';
import { ReservationDialog } from './ReservationDialog';
import { ReservationDetailDialog } from './ReservationDetailDialog';

interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  parentName: string;
  childName: string;
  age: number;
  ageMonths?: number;
  customerId: string;
  phoneNumber?: string;
  address?: string;
  lineUrl?: string;
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
  createdBy: string;
  createdAt: string;
}

interface CalendarViewProps {
  reservations: Reservation[];
  locations: string[];
  staff: string[];
  onReservationChange: () => void;
  onUpdateReservation: (id: string, data: any) => Promise<void>;
  onRefreshMasters?: () => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const PAYMENT_STATUS_LABELS = {
  paid: '支払済',
  unpaid: '未決済',
  pending: '保留',
};

const RESERVATION_STATUS_COLORS = {
  standby: 'bg-orange-100 text-orange-800 border-orange-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
};

const RESERVATION_STATUS_LABELS = {
  standby: '仮予約(スタンバイ)',
  confirmed: '予約確定',
};

// ヒートマップの色を計算（一日8件を基準）
const getHeatmapColor = (count: number) => {
  if (count === 0) return '';
  if (count <= 3) return 'bg-green-50 border-green-200';
  if (count <= 5) return 'bg-yellow-50 border-yellow-300';
  if (count <= 8) return 'bg-orange-50 border-orange-300';
  return 'bg-red-100 border-red-400'; // 8件超え
};

export function CalendarView({ reservations, locations, staff, onReservationChange, onUpdateReservation, onRefreshMasters }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // 前月の日付で埋める
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth();

  // 日付をJST（日本時間）でフォーマット
  const formatDateJST = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = formatDateJST(date);
    return reservations.filter(r => r.date === dateStr);
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return formatDateJST(date1) === formatDateJST(date2);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isTuesdayOrWednesday = (date: Date) => {
    const day = date.getDay();
    return day === 2 || day === 3; // 2=火曜, 3=水曜
  };

  // 検索フィルタリング
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;

    const query = searchQuery.toLowerCase();
    return reservations.filter(r => 
      r.parentName.toLowerCase().includes(query) ||
      r.childName.toLowerCase().includes(query) ||
      r.customerId.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      r.staffInCharge.toLowerCase().includes(query) ||
      r.note.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

  // 選択日の予約（時刻順）
  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return [];

    const dateStr = formatDateJST(selectedDate);
    const dayReservations = (searchQuery ? filteredReservations : reservations)
      .filter(r => r.date === dateStr);

    return dayReservations.sort((a, b) => {
      const timeA = a.timeSlot.split(':').map(Number);
      const timeB = b.timeSlot.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  }, [selectedDate, reservations, filteredReservations, searchQuery]);

  const handleTogglePaymentStatus = async (reservation: Reservation) => {
    const statusCycle = { paid: 'unpaid', unpaid: 'pending', pending: 'paid' } as const;
    const newStatus = statusCycle[reservation.paymentStatus];

    try {
      await onUpdateReservation(reservation.id, { paymentStatus: newStatus });
    } catch (err) {
      console.error('決済ステータス更新エラー:', err);
      alert('決済ステータスの更新に失敗しました');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー: 検索バーと新規予約ボタン */}
      <div className="p-4 border-b bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="親名・子名・顧客番号・拠点・スタッフ・備考・IDで検索"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              if (!selectedDate) {
                const today = new Date();
                setSelectedDate(today);
              }
              setShowAddDialog(true);
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>新規予約</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          {/* 左カラム: カレンダー */}
          <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-gray-900">
                  {year}年 {month + 1}月
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                今日
              </button>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={i}
                  className={`text-center py-1 text-sm ${
                    i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                if (!date) {
                  return <div key={i} className="aspect-square" />;
                }

                const dayReservations = getReservationsForDate(date);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const isTueWed = isTuesdayOrWednesday(date);
                const heatmapColor = getHeatmapColor(dayReservations.length);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square p-1 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                        : isTodayDate
                        ? 'bg-indigo-50 border-indigo-300'
                        : isTueWed
                        ? 'bg-amber-50 border-gray-200'
                        : heatmapColor
                        ? heatmapColor
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between items-center">
                      <span
                        className={`text-sm ${
                          date.getDay() === 0
                            ? isSelected
                              ? 'text-pink-200'
                              : 'text-red-600'
                            : date.getDay() === 6
                            ? isSelected
                              ? 'text-blue-200'
                              : 'text-blue-600'
                            : isSelected
                            ? 'text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayReservations.length > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-xs ${
                            isSelected 
                              ? 'bg-white text-indigo-600' 
                              : dayReservations.length > 8
                              ? 'bg-red-600 text-white ring-2 ring-red-300'
                              : dayReservations.length > 5
                              ? 'bg-orange-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {dayReservations.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 選択日の予約リスト */}
          <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-auto">
            {!selectedDate ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">カレンダーから日付を選択してください</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div>
                    <h3 className="text-gray-900 mb-1">
                      {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の予約
                      {selectedDateReservations.length > 0 && ` (${selectedDateReservations.length}件)`}
                    </h3>
                    {selectedDateReservations.length > 8 && (
                      <p className="text-orange-600 flex items-center gap-1 text-sm">
                        ⚠️ 8件を超えています
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      isEditMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isEditMode ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditMode ? '完了' : '編集'}
                  </button>
                </div>

                {selectedDateReservations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">予約がありません</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border-2 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                        style={{
                          borderColor: reservation.reservationStatus === 'confirmed' ? '#93c5fd' : '#fdba74'
                        }}
                        onClick={() => !isEditMode && setDetailReservation(reservation)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {reservation.timeSlot}
                            </span>
                            {isEditMode ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePaymentStatus(reservation);
                                }}
                                className={`px-2 py-1 rounded text-xs ${PAYMENT_STATUS_COLORS[reservation.paymentStatus]}`}
                              >
                                {PAYMENT_STATUS_LABELS[reservation.paymentStatus]}
                              </button>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs ${PAYMENT_STATUS_COLORS[reservation.paymentStatus]}`}>
                                {PAYMENT_STATUS_LABELS[reservation.paymentStatus]}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded border-2 text-xs ${RESERVATION_STATUS_COLORS[reservation.reservationStatus]}`}>
                              {RESERVATION_STATUS_LABELS[reservation.reservationStatus]}
                            </span>
                          </div>
                          {isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReservation(reservation);
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-xs whitespace-nowrap"
                            >
                              編集
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <div>
                              <span className="text-gray-500">親:</span> <span className="text-gray-900">{reservation.parentName}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">子:</span> <span className="text-gray-900">{reservation.childName}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">年齢:</span> <span className="text-gray-900">
                                {reservation.age}歳{reservation.age === 0 && reservation.ageMonths ? `(${reservation.ageMonths}ヶ月)` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">型取り:</span> <span className="text-gray-900">{reservation.moldCount}本</span>
                            </div>
                            <div className="col-span-2 text-xs text-gray-600">
                              {reservation.customerId}
                            </div>
                            <div>
                              <span className="text-gray-500">拠点:</span> <span className="text-gray-900">{reservation.location}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">担当:</span> <span className="text-gray-900">{reservation.staffInCharge || 'なし'}</span>
                            </div>
                          </div>
                          {reservation.note && (
                            <div className="pt-1 border-t text-xs">
                              <span className="text-gray-500">備考:</span> <span className="text-gray-700">{reservation.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 予約追加ダイアログ */}
      {showAddDialog && (
        <ReservationDialog
          reservation={null}
          selectedDate={selectedDate || new Date()}
          locations={locations}
          staff={staff}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            onReservationChange();
          }}
          onRefreshMasters={onRefreshMasters}
        />
      )}

      {/* 予約編集ダイアログ */}
      {editingReservation && (
        <ReservationDialog
          reservation={editingReservation}
          selectedDate={selectedDate || new Date()}
          locations={locations}
          staff={staff}
          onClose={() => setEditingReservation(null)}
          onSuccess={() => {
            setEditingReservation(null);
            onReservationChange();
          }}
          onRefreshMasters={onRefreshMasters}
        />
      )}

      {/* 予約詳細ダイアログ */}
      {detailReservation && (
        <ReservationDetailDialog
          reservation={detailReservation}
          onClose={() => setDetailReservation(null)}
          onEdit={(reservation) => {
            setDetailReservation(null);
            setEditingReservation(reservation);
          }}
          onDelete={() => {
            setDetailReservation(null);
            onReservationChange();
          }}
          onUpdatePaymentStatus={async (id, status) => {
            await onUpdateReservation(id, { paymentStatus: status });
            setDetailReservation(null);
            onReservationChange();
          }}
        />
      )}
    </div>
  );
}
