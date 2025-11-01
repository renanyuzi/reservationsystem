import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, Search, Phone, MessageCircle, User, History, Eye } from 'lucide-react';
import { api } from '../utils/api';
import { Reservation } from '../types';

interface Customer {
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
  standby: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-blue-100 text-blue-800',
  none: 'bg-gray-100 text-gray-800',
};

const RESERVATION_STATUS_LABELS = {
  standby: '仮予約(スタンバイ)',
  confirmed: '予約確定',
  none: '未予約',
};

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [customerResult, reservationResult] = await Promise.all([
        api.getCustomers(),
        api.getReservations(),
      ]);
      console.log('顧客データ:', customerResult);
      setCustomers(customerResult.customers || []);
      setReservations(reservationResult.reservations || []);
    } catch (err) {
      console.error('顧客一覧取得エラー:', err);
      alert(`顧客一覧の取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowDialog(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowDialog(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`${customer.parentName} さんの顧客情報を削除してもよろしいですか���`)) {
      return;
    }

    try {
      await api.deleteCustomer(customer.customerId);
      await loadCustomers();
    } catch (err) {
      console.error('顧客削除エラー:', err);
      alert(`顧客の削除に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.customerId.toLowerCase().includes(query) ||
      c.parentName.toLowerCase().includes(query) ||
      c.childName.toLowerCase().includes(query) ||
      c.phoneNumber.toLowerCase().includes(query) ||
      c.note.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h1 className="text-gray-900">顧客管理</h1>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="顧客ID、名前、電話番号で検索"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                顧客追加
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">顧客ID</th>
                  <th className="px-6 py-3 text-left text-gray-700">親名</th>
                  <th className="px-6 py-3 text-left text-gray-700">子名</th>
                  <th className="px-6 py-3 text-left text-gray-700">年齢</th>
                  <th className="px-6 py-3 text-left text-gray-700">電話番号</th>
                  <th className="px-6 py-3 text-left text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const ageDisplay = customer.age || customer.ageMonths
                    ? customer.age && customer.age > 0
                      ? `${customer.age}歳`
                      : `${customer.ageMonths || 0}ヶ月`
                    : '-';
                  
                  return (
                    <tr key={customer.customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{customer.customerId}</td>
                      <td className="px-6 py-4 text-gray-900">{customer.parentName}</td>
                      <td className="px-6 py-4 text-gray-900">{customer.childName}</td>
                      <td className="px-6 py-4 text-gray-900">{ageDisplay}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{customer.phoneNumber || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingCustomerId(customer.customerId)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden lg:inline">詳細</span>
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden lg:inline">編集</span>
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden lg:inline">削除</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              {searchQuery ? '該当する顧客が見つかりません' : '顧客が登録されていません'}
            </p>
          )}
        </div>
      </div>

      {showDialog && (
        <CustomerDialog
          customer={editingCustomer}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
            loadCustomers();
          }}
        />
      )}

      {viewingCustomerId && (
        <CustomerDetailDialog
          customerId={viewingCustomerId}
          reservations={reservations.filter(r => r.customerId === viewingCustomerId)}
          onClose={() => setViewingCustomerId(null)}
          onUpdate={loadCustomers}
        />
      )}
    </div>
  );
}

interface CustomerDialogProps {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CustomerDialog({ customer, onClose, onSuccess }: CustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: customer?.customerId || '',
    parentName: customer?.parentName || '',
    childName: customer?.childName || '',
    age: customer?.age || 0,
    ageMonths: customer?.ageMonths || 0,
    phoneNumber: customer?.phoneNumber || '',
    address: customer?.address || '',
    lineUrl: customer?.lineUrl || '',
    paymentStatus: customer?.paymentStatus || 'unpaid' as const,
    reservationStatus: customer?.reservationStatus || 'none' as const,
    note: customer?.note || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId.trim()) {
      setError('顧客IDを入力してください');
      return;
    }

    if (!formData.parentName.trim()) {
      setError('親名を入力してください');
      return;
    }

    if (!formData.childName.trim()) {
      setError('子名を入力してください');
      return;
    }

    setLoading(true);

    try {
      if (customer) {
        await api.updateCustomer(customer.customerId, formData);
      } else {
        await api.createCustomer(formData);
      }
      onSuccess();
    } catch (err) {
      console.error('顧客保存エラー:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-gray-900">
            {customer ? '顧客編集' : '顧客追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">顧客ID *</label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!!customer}
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
              <label className="block text-gray-700 mb-2">年齢</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <span className="flex items-center text-gray-600">歳</span>
                {formData.age === 0 && (
                  <>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.ageMonths}
                        onChange={(e) => setFormData({ ...formData, ageMonths: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        min="0"
                        max="11"
                        placeholder="0"
                      />
                    </div>
                    <span className="flex items-center text-gray-600">ヶ月</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                電話番号
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="090-1234-5678"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">住所</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="東京都渋谷区..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                LINE URL
              </label>
              <input
                type="url"
                value={formData.lineUrl}
                onChange={(e) => setFormData({ ...formData, lineUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://line.me/ti/p/..."
              />
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
              <label className="block text-gray-700 mb-2">予約状況 *</label>
              <select
                value={formData.reservationStatus}
                onChange={(e) => setFormData({ ...formData, reservationStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="none">未予約</option>
                <option value="standby">仮予約(スタンバイ)</option>
                <option value="confirmed">予約確定</option>
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
                customer ? '更新' : '追加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 顧客詳細ダイアログ
interface CustomerDetailDialogProps {
  customerId: string;
  reservations: Reservation[];
  onClose: () => void;
  onUpdate: () => void;
}

function CustomerDetailDialog({ customerId, reservations, onClose, onUpdate }: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const result = await api.getCustomers();
      const c = result.customers.find((cust: Customer) => cust.customerId === customerId);
      setCustomer(c || null);
    } catch (err) {
      console.error('顧客取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !customer) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  const sortedReservations = [...reservations].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white text-2xl mb-1">顧客360°ビュー</h2>
            <p className="text-purple-100 text-sm">{customer.parentName}様</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 顧客基本情報 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-700" />
                基本情報
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">顧客番号</p>
                    <p className="text-gray-900 font-mono">{customer.customerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">年齢</p>
                    <p className="text-gray-900">
                      {customer.age && customer.age > 0 ? `${customer.age}歳` : `${customer.ageMonths || 0}ヶ月`}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">親御さん</p>
                  <p className="text-gray-900">{customer.parentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">お子さま</p>
                  <p className="text-gray-900">{customer.childName}</p>
                </div>
                {customer.phoneNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      電話番号
                    </p>
                    <p className="text-gray-900">{customer.phoneNumber}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">住所</p>
                    <p className="text-gray-900 text-sm">{customer.address}</p>
                  </div>
                )}
                {customer.lineUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      LINE
                    </p>
                    <a href={customer.lineUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                      LINEで連絡
                    </a>
                  </div>
                )}
                {customer.note && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">備考</p>
                    <p className="text-gray-900 text-sm whitespace-pre-wrap">{customer.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ステータス */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 mb-4">ステータス</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">決済状況</p>
                  <div className={`px-3 py-2 rounded-lg text-center ${
                    customer.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                    customer.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {PAYMENT_STATUS_LABELS[customer.paymentStatus]}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">予約状況</p>
                  <div className={`px-3 py-2 rounded-lg text-center ${
                    customer.reservationStatus === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    customer.reservationStatus === 'standby' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {RESERVATION_STATUS_LABELS[customer.reservationStatus]}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">予約統計</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">総予約数</p>
                      <p className="text-2xl text-blue-600">{reservations.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">完了数</p>
                      <p className="text-2xl text-green-600">
                        {reservations.filter(r => r.deliveryStatus === 'completed').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 予約履歴 */}
          <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-700" />
              予約履歴（{reservations.length}件）
            </h3>
            {sortedReservations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">予約履歴がありません</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {sortedReservations.map((res) => (
                  <div key={res.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-900 font-medium">{res.date} {res.timeSlot}</p>
                        <p className="text-sm text-gray-600">拠点: {res.location} / 担当: {res.staffInCharge}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`px-2 py-1 rounded text-xs ${
                          res.reservationStatus === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {res.reservationStatus === 'confirmed' ? '確定' : '仮予約'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          res.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          res.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {res.paymentStatus === 'paid' ? '支払済' : res.paymentStatus === 'pending' ? '保留' : '未決済'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>型取り: {res.moldCount}件</span>
                      <span className={`px-2 py-1 rounded ${
                        res.deliveryStatus === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        res.deliveryStatus === 'shipped' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                        {res.deliveryStatus === 'completed' ? '納品完了' :
                         res.deliveryStatus === 'shipped' ? '発送済' : '製作中'}
                      </span>
                    </div>
                    {res.note && (
                      <p className="text-xs text-gray-500 mt-2 border-t pt-2">備考: {res.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
