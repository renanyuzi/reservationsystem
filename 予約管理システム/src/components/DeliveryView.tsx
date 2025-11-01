import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Package, Search, X } from 'lucide-react';
import { Reservation } from '../types';
import { getCustomerInfo } from '../utils/reservationHelpers';

interface DeliveryViewProps {
  reservations: Reservation[];
  onUpdateDeliveryStatus: (id: string, status: 'pending' | 'shipped' | 'completed') => Promise<void>;
}

const FONT_STYLE_LABELS = {
  mincho: '明朝体',
  gothic: 'ゴシック体',
  cursive: '筆記体',
};

const DELIVERY_STATUS_LABELS = {
  pending: '制作中',
  shipped: '受け取り待ち',
  completed: '完了',
};

const DELIVERY_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  shipped: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
};

// 型取り日から納期を計算（4-6週間後）
function calculateDeliveryDates(moldingDate: string) {
  const date = new Date(moldingDate);
  const minDate = new Date(date);
  minDate.setDate(date.getDate() + 28); // 4週間後
  const maxDate = new Date(date);
  maxDate.setDate(date.getDate() + 42); // 6週間後
  
  return {
    minDate: minDate.toISOString().split('T')[0],
    maxDate: maxDate.toISOString().split('T')[0],
  };
}

// 納期アラート判定
function getDeliveryAlert(moldingDate: string, status?: string, scheduledDeliveryDate?: string) {
  if (status === 'completed') return null;
  
  const today = new Date();
  let targetDate: Date;
  
  // scheduledDeliveryDateがあればそれを使用、なければ計算
  if (scheduledDeliveryDate) {
    targetDate = new Date(scheduledDeliveryDate);
  } else {
    const { maxDate } = calculateDeliveryDates(moldingDate);
    targetDate = new Date(maxDate);
  }
  
  const daysRemaining = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) {
    return { type: 'overdue', days: Math.abs(daysRemaining) };
  } else if (daysRemaining <= 7) {
    return { type: 'urgent', days: daysRemaining };
  } else if (daysRemaining <= 14) {
    return { type: 'warning', days: daysRemaining };
  }
  return null;
}

// 受け取り待ちアラート判定（2週間経過）
function getPickupAlert(createdAt: string, status?: string) {
  if (status !== 'shipped') return null;
  
  const today = new Date();
  const createdDate = new Date(createdAt);
  const daysSinceShipped = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceShipped >= 14) {
    return { type: 'pickup_overdue', days: daysSinceShipped };
  }
  return null;
}

export function DeliveryView({ reservations, onUpdateDeliveryStatus }: DeliveryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'shipped' | 'completed'>('all');

  // 1. まず仮予約を除外した配列を作成（すべての処理の基準）
  const activeReservations = useMemo(() => {
    return reservations.filter(r => r.reservationStatus === 'confirmed');
  }, [reservations]);

  // 2. 検索とステータスでフィルタリング
  const filteredReservations = useMemo(() => {
    return activeReservations.filter((r) => {
      const customerInfo = getCustomerInfo(r);
      const matchesSearch = 
        searchQuery === '' ||
        customerInfo.parentName.includes(searchQuery) ||
        customerInfo.childName.includes(searchQuery) ||
        customerInfo.customerId.includes(searchQuery) ||
        r.location.includes(searchQuery);
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (r.deliveryStatus || 'pending') === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [activeReservations, searchQuery, filterStatus]);

  // 3. ソート（納期優先、なければ型取り日）
  const sortedReservations = useMemo(() => {
    return [...filteredReservations].sort((a, b) => {
      // 納期アラートの優先度でソート
      const alertA = getDeliveryAlert(a.date, a.deliveryStatus, a.scheduledDeliveryDate);
      const alertB = getDeliveryAlert(b.date, b.deliveryStatus, b.scheduledDeliveryDate);
      
      // 期限切れ -> 緊急 -> 警告 -> その他の順
      const priorityA = alertA?.type === 'overdue' ? 0 : alertA?.type === 'urgent' ? 1 : alertA?.type === 'warning' ? 2 : 3;
      const priorityB = alertB?.type === 'overdue' ? 0 : alertB?.type === 'urgent' ? 1 : alertB?.type === 'warning' ? 2 : 3;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 同じ優先度の場合、納期でソート（納期がなければ型取り日）
      const dateA = a.scheduledDeliveryDate || a.date;
      const dateB = b.scheduledDeliveryDate || b.date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [filteredReservations]);

  // 4. 統計を確定予約（activeReservations）から計算
  const stats = useMemo(() => {
    const pending = activeReservations.filter(r => (r.deliveryStatus || 'pending') === 'pending').length;
    const shipped = activeReservations.filter(r => r.deliveryStatus === 'shipped').length;
    const overdue = activeReservations.filter(r => {
      const alert = getDeliveryAlert(r.date, r.deliveryStatus, r.scheduledDeliveryDate);
      return alert?.type === 'overdue';
    }).length;
    return { pending, shipped, overdue };
  }, [activeReservations]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b p-4">
        <h2 className="text-gray-900 mb-4">納期管理</h2>
        
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 mb-1">制作中</p>
                <p className="text-gray-900">{stats.pending}件</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 mb-1">発送済み</p>
                <p className="text-gray-900">{stats.shipped}件</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 mb-1">期限超過</p>
                <p className="text-gray-900">{stats.overdue}件</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="親名・子名・顧客番号・拠点で検索"
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
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">すべて</option>
            <option value="pending">制作中</option>
            <option value="shipped">受け取り待ち</option>
            <option value="completed">完了</option>
          </select>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto p-4">
        {sortedReservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            該当する予約がありません
          </div>
        ) : (
          <div className="space-y-3">
            {sortedReservations.map((reservation) => {
              const { minDate, maxDate } = calculateDeliveryDates(reservation.date);
              const alert = getDeliveryAlert(reservation.date, reservation.deliveryStatus, reservation.scheduledDeliveryDate);
              const pickupAlert = getPickupAlert(reservation.createdAt, reservation.deliveryStatus);
              const status = reservation.deliveryStatus || 'pending';
              
              return (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${
                    pickupAlert?.type === 'pickup_overdue'
                      ? 'border-purple-400 bg-purple-50'
                      : alert?.type === 'overdue' 
                      ? 'border-red-400 bg-red-50' 
                      : alert?.type === 'urgent'
                      ? 'border-orange-400 bg-orange-50'
                      : alert?.type === 'warning'
                      ? 'border-yellow-400'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded border-2 text-sm ${DELIVERY_STATUS_COLORS[status]}`}>
                          {DELIVERY_STATUS_LABELS[status]}
                        </span>
                        {pickupAlert && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-600 text-white flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            受け取り待ち {pickupAlert.days}日経過
                          </span>
                        )}
                        {alert && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            alert.type === 'overdue' 
                              ? 'bg-red-600 text-white' 
                              : alert.type === 'urgent'
                              ? 'bg-orange-600 text-white'
                              : 'bg-yellow-600 text-white'
                          }`}>
                            {alert.type === 'overdue' 
                              ? `${alert.days}日超過` 
                              : `残り${alert.days}日`}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">親名:</span> <span className="text-gray-900">{getCustomerInfo(reservation).parentName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">子名:</span> <span className="text-gray-900">{getCustomerInfo(reservation).childName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">顧客番号:</span> <span className="text-gray-900">{getCustomerInfo(reservation).customerId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">拠点:</span> <span className="text-gray-900">{reservation.location}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">型取り日:</span> <span className="text-gray-900">{reservation.date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">納期:</span> 
                          <span className="text-gray-900">
                            {reservation.scheduledDeliveryDate || `${minDate} ～ ${maxDate}`}
                          </span>
                        </div>
                      </div>
                      
                      {(reservation.engravingName || reservation.engravingDate || reservation.fontStyle) && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-gray-500 text-sm mb-1">刻印情報</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {reservation.engravingName && (
                              <div>
                                <span className="text-gray-500">名前:</span> <span className="text-gray-900">{reservation.engravingName}</span>
                              </div>
                            )}
                            {reservation.engravingDate && (
                              <div>
                                <span className="text-gray-500">日付:</span> <span className="text-gray-900">{reservation.engravingDate}</span>
                              </div>
                            )}
                            {reservation.fontStyle && (
                              <div>
                                <span className="text-gray-500">書体:</span> <span className="text-gray-900">{FONT_STYLE_LABELS[reservation.fontStyle]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onUpdateDeliveryStatus(reservation.id, 'pending')}
                        className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${
                          status === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        制作中
                      </button>
                      <button
                        onClick={() => onUpdateDeliveryStatus(reservation.id, 'shipped')}
                        className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${
                          status === 'shipped'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        受け取り待ち
                      </button>
                      <button
                        onClick={() => onUpdateDeliveryStatus(reservation.id, 'completed')}
                        className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${
                          status === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        完了
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
