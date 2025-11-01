import { useState, useEffect } from 'react';
import { X, Loader2, Clock, Package, CreditCard, CheckCircle, MapPin, Calendar, User, Phone, MessageCircle, Home, Truck, Edit2 } from 'lucide-react';
import { api } from '../utils/api';
import { Reservation, TimelineEvent } from '../types';

interface ReservationTimelineDialogProps {
  reservationId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReservationTimelineDialog({ reservationId, onClose, onUpdate }: ReservationTimelineDialogProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    setLoading(true);
    try {
      const result = await api.getReservations();
      const res = result.reservations.find((r: Reservation) => r.id === reservationId);
      if (res) {
        setReservation(res);
        generateTimeline(res);
      }
    } catch (err) {
      console.error('予約取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeline = (res: Reservation) => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        reservationId: res.id,
        type: 'created',
        title: '予約作成',
        description: `${res.parentName}様の予約が作成されました`,
        timestamp: res.createdAt || res.date,
        performedBy: res.staffInCharge,
      },
    ];

    if (res.reservationStatus === 'confirmed') {
      events.push({
        id: '2',
        reservationId: res.id,
        type: 'confirmed',
        title: '予約確定',
        description: '予約が確定されました',
        timestamp: res.updatedAt || res.date,
        performedBy: res.staffInCharge,
      });
    }

    if (res.paymentStatus === 'paid') {
      events.push({
        id: '3',
        reservationId: res.id,
        type: 'payment_received',
        title: '決済完了',
        description: 'お支払いを確認しました',
        timestamp: res.updatedAt || res.date,
      });
    }

    if (res.deliveryStatus === 'shipped') {
      events.push({
        id: '4',
        reservationId: res.id,
        type: 'shipped',
        title: '発送完了',
        description: res.deliveryMethod === 'shipping' ? '商品を発送しました' : '店舗受取準備完了',
        timestamp: res.actualDeliveryDate || res.updatedAt || res.date,
      });
    }

    if (res.deliveryStatus === 'completed') {
      events.push({
        id: '5',
        reservationId: res.id,
        type: 'completed',
        title: '納品完了',
        description: 'お客様に商品をお渡ししました',
        timestamp: res.actualDeliveryDate || res.updatedAt || res.date,
      });
    }

    setTimeline(events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  };

  const handleTogglePayment = async () => {
    if (!reservation || !editMode) return;
    
    setUpdating(true);
    try {
      const newStatus = reservation.paymentStatus === 'paid' ? 'unpaid' : 'paid';
      await api.updateReservation(reservation.id, { paymentStatus: newStatus });
      await loadReservation();
      onUpdate();
    } catch (err) {
      console.error('決済ステータス更新エラー:', err);
      alert('更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleReservationStatus = async () => {
    if (!reservation || !editMode) return;
    
    setUpdating(true);
    try {
      const newStatus = reservation.reservationStatus === 'confirmed' ? 'standby' : 'confirmed';
      await api.updateReservation(reservation.id, { reservationStatus: newStatus });
      await loadReservation();
      onUpdate();
    } catch (err) {
      console.error('予約ステータス更新エラー:', err);
      alert('更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleDeliveryStatus = async () => {
    if (!reservation || !editMode) return;
    
    setUpdating(true);
    try {
      const statusOrder: Array<'pending' | 'shipped' | 'completed'> = ['pending', 'shipped', 'completed'];
      const currentIndex = statusOrder.indexOf(reservation.deliveryStatus || 'pending');
      const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      
      await api.updateReservation(reservation.id, { 
        deliveryStatus: newStatus,
        actualDeliveryDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : reservation.actualDeliveryDate
      });
      await loadReservation();
      onUpdate();
    } catch (err) {
      console.error('納品ステータス更新エラー:', err);
      alert('更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'standby': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (type: string, status: string) => {
    if (type === 'payment') {
      return status === 'paid' ? '支払済' : status === 'pending' ? '保留' : '未決済';
    }
    if (type === 'reservation') {
      return status === 'confirmed' ? '予約確定' : '仮予約';
    }
    if (type === 'delivery') {
      return status === 'completed' ? '納品完了' : status === 'shipped' ? '発送済' : '製作中';
    }
    return status;
  };

  const scheduledDelivery = reservation.scheduledDeliveryDate || 
    (reservation.date ? new Date(new Date(reservation.date).getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white text-2xl mb-1">案件タイムライン</h2>
            <p className="text-indigo-100 text-sm">予約ID: {reservation.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg transition-all ${
                editMode 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
              }`}
            >
              <Edit2 className="w-4 h-4 inline mr-2" />
              {editMode ? '編集モード' : '閲覧モード'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左列：顧客情報 */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-700" />
                  顧客情報
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">顧客番号</p>
                    <p className="text-gray-900 font-mono">{reservation.customerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">親御さん</p>
                    <p className="text-gray-900">{reservation.parentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">お子さま</p>
                    <p className="text-gray-900">{reservation.childName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">年齢</p>
                    <p className="text-gray-900">
                      {reservation.age > 0 ? `${reservation.age}歳` : `${reservation.ageMonths || 0}ヶ月`}
                    </p>
                  </div>
                  {reservation.phoneNumber && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        電話番号
                      </p>
                      <p className="text-gray-900">{reservation.phoneNumber}</p>
                    </div>
                  )}
                  {reservation.address && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        住所
                      </p>
                      <p className="text-gray-900 text-sm">{reservation.address}</p>
                    </div>
                  )}
                  {reservation.lineUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        LINE
                      </p>
                      <a href={reservation.lineUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                        LINEで連絡
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 予約詳細 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  予約詳細
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">予約日時</p>
                    <p className="text-gray-900">{reservation.date} {reservation.timeSlot || '時間未設定'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">所要時間</p>
                    <p className="text-gray-900">{reservation.duration}分</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">拠点</p>
                    <p className="text-gray-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {reservation.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">担当スタッフ</p>
                    <p className="text-gray-900">{reservation.staffInCharge}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">型取り件数</p>
                    <p className="text-gray-900">{reservation.moldCount}件</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 中央列：ステータスと製作情報 */}
            <div className="space-y-4">
              {/* ステータスカード */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 mb-4">ステータス</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">予約状況</p>
                    <button
                      onClick={handleToggleReservationStatus}
                      disabled={!editMode || updating}
                      className={`w-full px-3 py-2 rounded-lg border transition-all text-center ${
                        reservation.reservationStatus === 'confirmed' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      } ${editMode ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${
                        updating ? 'opacity-50' : ''
                      }`}
                    >
                      {getStatusLabel('reservation', reservation.reservationStatus)}
                    </button>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-2">決済状況</p>
                    <button
                      onClick={handleTogglePayment}
                      disabled={!editMode || updating}
                      className={`w-full px-3 py-2 rounded-lg border transition-all text-center ${
                        reservation.paymentStatus === 'paid' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : reservation.paymentStatus === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      } ${editMode ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${
                        updating ? 'opacity-50' : ''
                      }`}
                    >
                      {getStatusLabel('payment', reservation.paymentStatus)}
                    </button>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">納品ステータス</p>
                    <button
                      onClick={handleToggleDeliveryStatus}
                      disabled={!editMode || updating}
                      className={`w-full px-3 py-2 rounded-lg border transition-all text-center ${
                        (reservation.deliveryStatus || 'pending') === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : (reservation.deliveryStatus || 'pending') === 'shipped'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      } ${editMode ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${
                        updating ? 'opacity-50' : ''
                      }`}
                    >
                      {getStatusLabel('delivery', reservation.deliveryStatus || 'pending')}
                    </button>
                  </div>
                </div>
                {editMode && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    ※ クリックでステータス変更
                  </p>
                )}
              </div>

              {/* 刻印情報 */}
              {(reservation.engravingName || reservation.engravingDate) && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="text-gray-900 mb-4">刻印情報</h3>
                  <div className="space-y-3">
                    {reservation.engravingName && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">刻印名</p>
                        <p className="text-gray-900">{reservation.engravingName}</p>
                      </div>
                    )}
                    {reservation.engravingDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">刻印日付</p>
                        <p className="text-gray-900">{reservation.engravingDate}</p>
                      </div>
                    )}
                    {reservation.fontStyle && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">書体</p>
                        <p className="text-gray-900">
                          {reservation.fontStyle === 'mincho' ? '明朝体' : 
                           reservation.fontStyle === 'gothic' ? 'ゴシック体' : '筆記体'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 配送情報 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-700" />
                  配送情報
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">受取方法</p>
                    <p className="text-gray-900">
                      {reservation.deliveryMethod === 'shipping' ? '郵送' : 'スタジオ受取'}
                    </p>
                  </div>
                  {reservation.deliveryMethod === 'shipping' && reservation.shippingAddress && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">配送先</p>
                      <p className="text-gray-900 text-sm">{reservation.shippingAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">予定納期</p>
                    <p className="text-gray-900">{scheduledDelivery}</p>
                  </div>
                  {reservation.actualDeliveryDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">実際の納品日</p>
                      <p className="text-gray-900">{reservation.actualDeliveryDate}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右列：タイムライン */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-700" />
                  進捗タイムライン
                </h3>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-300" />
                      )}
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          event.type === 'created' ? 'bg-blue-50 border-2 border-blue-200' :
                          event.type === 'confirmed' ? 'bg-indigo-50 border-2 border-indigo-200' :
                          event.type === 'payment_received' ? 'bg-green-50 border-2 border-green-200' :
                          event.type === 'shipped' ? 'bg-purple-50 border-2 border-purple-200' :
                          event.type === 'completed' ? 'bg-green-50 border-2 border-green-200' :
                          'bg-gray-50 border-2 border-gray-200'
                        }`}>
                          {event.type === 'created' && <Calendar className="w-4 h-4 text-blue-600" />}
                          {event.type === 'confirmed' && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                          {event.type === 'payment_received' && <CreditCard className="w-4 h-4 text-green-600" />}
                          {event.type === 'shipped' && <Truck className="w-4 h-4 text-purple-600" />}
                          {event.type === 'completed' && <Package className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-gray-900 font-medium">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{event.timestamp}</p>
                          {event.performedBy && (
                            <p className="text-xs text-gray-500">担当: {event.performedBy}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 備考 */}
              {reservation.note && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm mt-4">
                  <h3 className="text-gray-900 mb-2">備考</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
