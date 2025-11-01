import { useState, useEffect } from 'react';
import { Loader2, Calendar, AlertCircle, CreditCard, Package, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import { Reservation, Task } from '../types';

interface DashboardViewProps {
  role: 'admin' | 'staff';
  userName: string;
}

export function DashboardView({ role, userName }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getReservations();
      setReservations(result.reservations || []);
    } catch (err) {
      console.error('データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.date === today);
  const myReservations = role === 'staff' 
    ? reservations.filter(r => r.staffInCharge === userName)
    : reservations;

  const stats = {
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter(r => r.reservationStatus === 'confirmed').length,
    paidReservations: reservations.filter(r => r.paymentStatus === 'paid').length,
    completedDeliveries: reservations.filter(r => r.deliveryStatus === 'completed').length,
  };

  // やるべきことリスト
  const actionItems = {
    standbyReservations: reservations.filter(r => r.reservationStatus === 'standby'),
    upcomingDeliveries: reservations
      .filter(r => r.deliveryStatus !== 'completed' && r.scheduledDeliveryDate)
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDeliveryDate!).getTime();
        const dateB = new Date(b.scheduledDeliveryDate!).getTime();
        return dateA - dateB;
      })
      .slice(0, 10),
  };

  if (role === 'admin') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600 mt-1">ようこそ、{userName}さん</p>
            </div>
            <p className="text-gray-600">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 mb-1">総予約数</p>
                  <p className="text-3xl">{stats.totalReservations}</p>
                </div>
                <Calendar className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 mb-1">確定予約</p>
                  <p className="text-3xl">{stats.confirmedReservations}</p>
                </div>
                <CheckCircle className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-1">支払済</p>
                  <p className="text-3xl">{stats.paidReservations}</p>
                </div>
                <CreditCard className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-1">納品完了</p>
                  <p className="text-3xl">{stats.completedDeliveries}</p>
                </div>
                <Package className="w-12 h-12 opacity-50" />
              </div>
            </div>
          </div>

          {/* 本日の予約 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              本日の予約（{todayReservations.length}件）
            </h2>
            {todayReservations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">本日の予約はありません</p>
            ) : (
              <div className="space-y-3">
                {todayReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div>
                      <p className="text-gray-900">{res.timeSlot || '時間未設定'} - {res.parentName}様</p>
                      <p className="text-sm text-gray-600">担当: {res.staffInCharge} / 拠点: {res.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        res.reservationStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {res.reservationStatus === 'confirmed' ? '確定' : '仮予約'}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        res.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {res.paymentStatus === 'paid' ? '支払済' : '未決済'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* やるべきことリスト */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 仮予約の確定 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600" />
                仮予約の確定が必要（{actionItems.standbyReservations.length}件）
              </h2>
              {actionItems.standbyReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">仮予約はありません</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {actionItems.standbyReservations.map((res) => (
                    <div key={res.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{res.parentName}様</p>
                          <p className="text-sm text-gray-600 mt-1">
                            予約日: {res.date} {res.timeSlot}
                          </p>
                          <p className="text-xs text-gray-500">拠点: {res.location} / 担当: {res.staffInCharge}</p>
                        </div>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          仮予約
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 納期管理 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                製作中の案件（納期順）
              </h2>
              {actionItems.upcomingDeliveries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">製作中の案件はありません</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {actionItems.upcomingDeliveries.map((res) => {
                    const deliveryDate = new Date(res.scheduledDeliveryDate!);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 7;
                    const isPast = daysUntil < 0;

                    return (
                      <div key={res.id} className={`p-4 rounded-lg border ${
                        isPast ? 'bg-red-50 border-red-200' :
                        isUrgent ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{res.parentName}様</p>
                            <p className="text-sm text-gray-600 mt-1">
                              予定納期: {res.scheduledDeliveryDate}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isPast ? '納期超過' : isUrgent ? `あと${daysUntil}日` : `${daysUntil}日後`}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            res.deliveryStatus === 'shipped' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {res.deliveryStatus === 'shipped' ? '発送済' : '製作中'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // スタッフダッシュボード
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">スタッフダッシュボード</h1>
            <p className="text-gray-600 mt-1">ようこそ、{userName}さん</p>
          </div>
          <p className="text-gray-600">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>

        {/* 担当予約サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">担当予約</p>
                <p className="text-3xl">{myReservations.length}</p>
              </div>
              <Users className="w-12 h-12 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">支払済</p>
                <p className="text-3xl">{myReservations.filter(r => r.paymentStatus === 'paid').length}</p>
              </div>
              <CreditCard className="w-12 h-12 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">納品完了</p>
                <p className="text-3xl">{myReservations.filter(r => r.deliveryStatus === 'completed').length}</p>
              </div>
              <Package className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>

        {/* 本日の担当予約 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            本日の担当予約
          </h2>
          {todayReservations.filter(r => r.staffInCharge === userName).length === 0 ? (
            <p className="text-gray-500 text-center py-8">本日の担当予約はありません</p>
          ) : (
            <div className="space-y-3">
              {todayReservations.filter(r => r.staffInCharge === userName).map((res) => (
                <div key={res.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">{res.timeSlot} - {res.parentName}様</p>
                      <p className="text-sm text-gray-600">拠点: {res.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        res.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {res.paymentStatus === 'paid' ? '支払済' : '未決済'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 本日の担当予約 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            本日の担当予約
          </h2>
          {todayReservations.filter(r => r.staffInCharge === userName).length === 0 ? (
            <p className="text-gray-500 text-center py-8">本日の担当予約はありません</p>
          ) : (
            <div className="space-y-3">
              {todayReservations.filter(r => r.staffInCharge === userName).map((res) => (
                <div key={res.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">{res.timeSlot || '時間未設定'} - {res.parentName}様</p>
                      <p className="text-sm text-gray-600">拠点: {res.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        res.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {res.paymentStatus === 'paid' ? '支払済' : '未決済'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* やるべきことリスト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 仮予約の確定 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              仮予約の確定が必要（{actionItems.standbyReservations.filter(r => r.staffInCharge === userName).length}件）
            </h2>
            {actionItems.standbyReservations.filter(r => r.staffInCharge === userName).length === 0 ? (
              <p className="text-gray-500 text-center py-8">仮予約はありません</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {actionItems.standbyReservations
                  .filter(r => r.staffInCharge === userName)
                  .map((res) => (
                    <div key={res.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{res.parentName}様</p>
                          <p className="text-sm text-gray-600 mt-1">
                            予約日: {res.date} {res.timeSlot}
                          </p>
                          <p className="text-xs text-gray-500">拠点: {res.location}</p>
                        </div>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          仮予約
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 納期管理 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              担当案件（納期順）
            </h2>
            {actionItems.upcomingDeliveries.filter(r => r.staffInCharge === userName).length === 0 ? (
              <p className="text-gray-500 text-center py-8">製作中の案件はありません</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {actionItems.upcomingDeliveries
                  .filter(r => r.staffInCharge === userName)
                  .map((res) => {
                    const deliveryDate = new Date(res.scheduledDeliveryDate!);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 7;
                    const isPast = daysUntil < 0;

                    return (
                      <div key={res.id} className={`p-4 rounded-lg border ${
                        isPast ? 'bg-red-50 border-red-200' :
                        isUrgent ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{res.parentName}様</p>
                            <p className="text-sm text-gray-600 mt-1">
                              予定納期: {res.scheduledDeliveryDate}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isPast ? '納期超過' : isUrgent ? `あと${daysUntil}日` : `${daysUntil}日後`}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            res.deliveryStatus === 'shipped' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {res.deliveryStatus === 'shipped' ? '発送済' : '製作中'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
