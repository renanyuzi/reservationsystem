import { useState, useEffect } from 'react';
import { X, Loader2, Search, User } from 'lucide-react';
import { api } from '../utils/api';

interface Customer {
  customerId: string;
  parentName: string;
  childName: string;
  age?: number;
  ageMonths?: number;
  phoneNumber: string;
  address?: string;
  lineUrl: string;
  note: string;
}

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    // ダイアログが開かれたときにマスターデータをリフレッシュ
    if (onRefreshMasters) {
      onRefreshMasters();
    }
    // 顧客一覧を読み込み
    loadCustomers();
  }, [onRefreshMasters]);

  const loadCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result.customers || []);
    } catch (err) {
      console.error('顧客一覧取得エラー:', err);
    }
  };

  // 日付をJST（日本時間）でフォーマット
  const formatDateJST = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: reservation?.date || formatDateJST(selectedDate),
    timeSlot: reservation?.timeSlot || '10:00',
    duration: reservation?.duration || 60,
    parentName: reservation?.parentName || '',
    childName: reservation?.childName || '',
    age: reservation?.age || 0,
    ageMonths: reservation?.ageMonths || 0,
    customerId: reservation?.customerId || '',
    phoneNumber: reservation?.phoneNumber || '',
    address: reservation?.address || '',
    lineUrl: reservation?.lineUrl || '',
    moldCount: reservation?.moldCount || 1,
    paymentStatus: reservation?.paymentStatus || 'unpaid' as const,
    reservationStatus: reservation?.reservationStatus || 'standby' as const,
    location: reservation?.location || (locations.length > 0 ? locations[0] : ''),
    staffInCharge: reservation?.staffInCharge || '',
    note: reservation?.note || '',
    engravingName: reservation?.engravingName || '',
    engravingDate: reservation?.engravingDate || '',
    fontStyle: reservation?.fontStyle || 'gothic' as const,
    deliveryStatus: reservation?.deliveryStatus || 'pending' as const,
  });

  // 拠点が更新されたらフォームデータも更新
  useEffect(() => {
    if (!reservation) {
      if (locations.length > 0 && !formData.location) {
        setFormData(prev => ({ ...prev, location: locations[0] }));
      }
    }
  }, [locations, reservation, formData.location]);

  // 顧客を選択したときの処理
  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.customerId,
      parentName: customer.parentName,
      childName: customer.childName,
      age: customer.age || 0,
      ageMonths: customer.ageMonths || 0,
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      lineUrl: customer.lineUrl || '',
    }));
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  // 顧客検索フィルタリング
  const filteredCustomers = customers.filter(c => {
    const query = customerSearchQuery.toLowerCase();
    return (
      c.customerId.toLowerCase().includes(query) ||
      c.parentName.toLowerCase().includes(query) ||
      c.childName.toLowerCase().includes(query) ||
      (c.phoneNumber && c.phoneNumber.toLowerCase().includes(query))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション（日付と名前のみ必須）
    if (!formData.date) {
      setError('日付を入力してください');
      return;
    }

    if (!formData.parentName && !formData.childName) {
      setError('親名または子名のいずれかを入力してください');
      return;
    }

    setLoading(true);

    try {
      // 顧客情報を保存または更新
      const customerData = {
        customerId: formData.customerId,
        parentName: formData.parentName,
        childName: formData.childName,
        age: formData.age,
        ageMonths: formData.ageMonths,
        phoneNumber: formData.phoneNumber || '',
        address: formData.address || '',
        lineUrl: formData.lineUrl || '',
        note: formData.note || '',
      };

      // 既存顧客かチェック
      const existingCustomer = customers.find(c => c.customerId === formData.customerId);
      
      if (formData.customerId && existingCustomer) {
        // 既存顧客を更新
        await api.updateCustomer(formData.customerId, customerData);
      } else if (formData.customerId || formData.parentName || formData.childName) {
        // 新規顧客を作成（顧客番号がなければ自動生成される）
        try {
          await api.createCustomer(customerData);
        } catch (err) {
          // 顧客作成エラーは警告のみ（予約は続行）
          console.warn('顧客情報の保存に失敗:', err);
        }
      }

      // 予約を保存
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-indigo-700 sticky top-0 z-10">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 顧客情報セクション */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-600 rounded"></span>
                顧客情報
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">既存顧客から選択</span>
                <span className="sm:hidden">顧客検索</span>
              </button>
            </div>

            {/* 顧客検索ドロップダウン */}
            {showCustomerSearch && (
              <div className="mb-4 bg-white border-2 border-indigo-300 rounded-lg p-3 shadow-lg">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="顧客番号・親名・子名・電話番号で検索"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="max-h-60 overflow-auto space-y-1">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">顧客が見つかりません</p>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.customerId}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{customer.parentName}</span>
                          {customer.childName && (
                            <span className="text-gray-600">/ {customer.childName}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          顧客番号: {customer.customerId}
                          {customer.phoneNumber && ` • ${customer.phoneNumber}`}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">顧客番号</label>
                <input
                  type="text"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  placeholder="自動生成される場合は空欄可"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">親御さんのお名前 *</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">お子さまのお名前 *</label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  年齢
                  {formData.age === 0 && formData.ageMonths > 0 && (
                    <span className="ml-2 text-indigo-600">({formData.ageMonths}ヶ月)</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    min="0"
                    max="99"
                    placeholder="歳"
                  />
                  {formData.age === 0 && (
                    <input
                      type="number"
                      value={formData.ageMonths}
                      onChange={(e) => setFormData({ ...formData, ageMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      min="0"
                      max="36"
                      placeholder="ヶ月"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">電話番号</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="090-1234-5678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">住所</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="東京都渋谷区..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">LINE URL</label>
                <input
                  type="url"
                  value={formData.lineUrl}
                  onChange={(e) => setFormData({ ...formData, lineUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="https://line.me/..."
                />
              </div>
            </div>
          </div>

          {/* 予約情報セクション */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded"></span>
              予約情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">日付 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">時間帯 *</label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                >
                  <option value={30}>30分</option>
                  <option value={60}>60分</option>
                  <option value={90}>90分</option>
                  <option value={120}>120分</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">型取り本数</label>
                <input
                  type="number"
                  value={formData.moldCount}
                  onChange={(e) => setFormData({ ...formData, moldCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">拠点</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">選択してください</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">担当スタッフ</label>
                <select
                  value={formData.staffInCharge}
                  onChange={(e) => setFormData({ ...formData, staffInCharge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">なし</option>
                  {staff.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">決済ステータス</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="unpaid" className="bg-red-50">🔴 未決済</option>
                  <option value="paid" className="bg-green-50">✅ 支払済</option>
                  <option value="pending" className="bg-yellow-50">⏳ 保留</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">予約ステータス</label>
                <select
                  value={formData.reservationStatus}
                  onChange={(e) => setFormData({ ...formData, reservationStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="standby" className="bg-orange-50">🟠 仮予約(スタンバイ)</option>
                  <option value="confirmed" className="bg-blue-50">🔵 予約確定</option>
                </select>
              </div>
            </div>
          </div>

          {/* 刻印情報セクション */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-600 rounded"></span>
              ネームプレート刻印情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">刻印する名前</label>
                <input
                  type="text"
                  value={formData.engravingName}
                  onChange={(e) => setFormData({ ...formData, engravingName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="例: 花子"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">刻印する日付</label>
                <input
                  type="text"
                  value={formData.engravingDate}
                  onChange={(e) => setFormData({ ...formData, engravingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  placeholder="例: 2024.11.1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">書体</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontStyle"
                      value="mincho"
                      checked={formData.fontStyle === 'mincho'}
                      onChange={(e) => setFormData({ ...formData, fontStyle: e.target.value as any })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>明朝体</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontStyle"
                      value="gothic"
                      checked={formData.fontStyle === 'gothic'}
                      onChange={(e) => setFormData({ ...formData, fontStyle: e.target.value as any })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>ゴシック体</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontStyle"
                      value="cursive"
                      checked={formData.fontStyle === 'cursive'}
                      onChange={(e) => setFormData({ ...formData, fontStyle: e.target.value as any })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>筆記体</span>
                  </label>
                </div>
              </div>
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
