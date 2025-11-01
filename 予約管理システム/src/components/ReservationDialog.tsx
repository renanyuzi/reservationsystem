import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  parentName: string;
  childName: string;
  customerId: string;
  moldCount: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  progressStatus: 'waiting' | 'in-progress' | 'completed';
  location: string;
  staffInCharge: string;
  note: string;
}

interface ReservationDialogProps {
  reservation: Reservation | null;
  selectedDate: Date;
  locations: string[];
  staff: string[];
  onClose: () => void;
  onSuccess: () => void;
  onRefreshMasters?: () => void;
}

// 9:00-17:00の30分単位の時間スロットを生成
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 17 && minute > 0) break; // 17:00までで終了
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

export function ReservationDialog({
  reservation,
  selectedDate,
  locations,
  staff,
  onClose,
  onSuccess,
  onRefreshMasters,
}: ReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    // ダイアログが開かれたときにマスターデータをリフレッシュ
    if (onRefreshMasters) {
      onRefreshMasters();
    }
  }, [onRefreshMasters]);

  const [formData, setFormData] = useState({
    date: reservation?.date || selectedDate.toISOString().split('T')[0],
    timeSlot: reservation?.timeSlot || '10:00',
    duration: reservation?.duration || 60,
    parentName: reservation?.parentName || '',
    childName: reservation?.childName || '',
    customerId: reservation?.customerId || '',
    moldCount: reservation?.moldCount || 1,
    paymentStatus: reservation?.paymentStatus || 'unpaid' as const,
    progressStatus: reservation?.progressStatus || 'waiting' as const,
    location: reservation?.location || (locations.length > 0 ? locations[0] : ''),
    staffInCharge: reservation?.staffInCharge || (staff.length > 0 ? staff[0] : ''),
    note: reservation?.note || '',
  });

  // スタッフまたは拠点が更新されたらフォームデータも更新
  useEffect(() => {
    if (!reservation) {
      if (locations.length > 0 && !formData.location) {
        setFormData(prev => ({ ...prev, location: locations[0] }));
      }
      if (staff.length > 0 && !formData.staffInCharge) {
        setFormData(prev => ({ ...prev, staffInCharge: staff[0] }));
      }
    }
  }, [locations, staff, reservation, formData.location, formData.staffInCharge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (locations.length === 0) {
      setError('拠点が設定されていません。設定画面から拠点を追加してください。');
      return;
    }

    if (staff.length === 0) {
      setError('担当スタッフが設定されていません。設定画面からスタッフを追加してください。');
      return;
    }

    if (!formData.location) {
      setError('拠点を選択してください');
      return;
    }

    if (!formData.staffInCharge) {
      setError('担当スタッフを選択してください');
      return;
    }

    setLoading(true);

    try {
      if (reservation) {
        await api.updateReservation(reservation.id, formData);
      } else {
        await api.createReservation(formData);
      }
      onSuccess();
    } catch (err) {
      console.error('予約保存エラー:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h2 className="text-white">
            {reservation ? '予約編集' : '新規予約追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-800 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">日付 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">時間帯 *</label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">所要時間 *</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value={30}>30分</option>
                <option value={60}>60分</option>
                <option value={90}>90分</option>
                <option value={120}>120分</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">型取り本数 *</label>
              <input
                type="number"
                value={formData.moldCount}
                onChange={(e) => setFormData({ ...formData, moldCount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">親名 *</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">子名 *</label>
              <input
                type="text"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">顧客番号 *</label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">拠点 *</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {locations.length === 0 && (
                  <option value="">拠点を設定してください</option>
                )}
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">担当スタッフ *</label>
              <select
                value={formData.staffInCharge}
                onChange={(e) => setFormData({ ...formData, staffInCharge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {staff.length === 0 && (
                  <option value="">スタッフを設定してください</option>
                )}
                {staff.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">決済ステータス *</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="unpaid">未決済</option>
                <option value="paid">支払済</option>
                <option value="pending">保留</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">進行ステータス *</label>
              <select
                value={formData.progressStatus}
                onChange={(e) => setFormData({ ...formData, progressStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="waiting">待機中</option>
                <option value="in-progress">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">備考</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                reservation ? '更新' : '追加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
