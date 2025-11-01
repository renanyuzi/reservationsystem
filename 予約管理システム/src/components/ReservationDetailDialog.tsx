import { useState } from 'react';
import { X, Edit, Trash2, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { Reservation } from '../types';
import { getCustomerInfo } from '../utils/reservationHelpers';

interface ReservationDetailDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: () => void;
  onUpdatePaymentStatus: (id: string, status: 'paid' | 'unpaid' | 'pending') => Promise<void>;
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
  standby: 'bg-orange-100 text-orange-800 border-orange-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
};

const RESERVATION_STATUS_LABELS = {
  standby: '仮予約(スタンバイ)',
  confirmed: '予約確定',
};

export function ReservationDetailDialog({
  reservation,
  onClose,
  onEdit,
  onDelete,
  onUpdatePaymentStatus,
}: ReservationDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const customerInfo = getCustomerInfo(reservation);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteReservation(reservation.id);
      onDelete();
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = async (status: 'paid' | 'unpaid' | 'pending') => {
    setLoading(true);
    try {
      await onUpdatePaymentStatus(reservation.id, status);
    } catch (err) {
      console.error('決済ステータス更新エラー:', err);
      alert('決済ステータスの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-gray-900">予約詳細</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-gray-900">日時</h3>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded">
                {reservation.date} {reservation.timeSlot || '時間未設定'} ({reservation.duration}分)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">親名</p>
                <p className="text-gray-900">{customerInfo.parentName}</p>
              </div>
              <div>
                <p className="text-gray-500">子名</p>
                <p className="text-gray-900">{customerInfo.childName}</p>
              </div>
              <div>
                <p className="text-gray-500">年齢</p>
                <p className="text-gray-900">
                  {customerInfo.age}歳
                  {customerInfo.age === 0 && customerInfo.ageMonths && ` (${customerInfo.ageMonths}ヶ月)`}
                </p>
              </div>
              <div>
                <p className="text-gray-500">顧客番号</p>
                <p className="text-gray-900">{customerInfo.customerId}</p>
              </div>
              {customerInfo.phoneNumber && (
                <div>
                  <p className="text-gray-500">電話番号</p>
                  <p className="text-gray-900">{customerInfo.phoneNumber}</p>
                </div>
              )}
              {customerInfo.address && (
                <div className="md:col-span-2">
                  <p className="text-gray-500">住所</p>
                  <p className="text-gray-900">{customerInfo.address}</p>
                </div>
              )}
              {customerInfo.lineUrl && (
                <div className="md:col-span-2">
                  <p className="text-gray-500">LINE URL</p>
                  <a href={customerInfo.lineUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                    {customerInfo.lineUrl}
                  </a>
                </div>
              )}
              <div>
                <p className="text-gray-500">型取り本数</p>
                <p className="text-gray-900">{reservation.moldCount}本</p>
              </div>
              <div>
                <p className="text-gray-500">拠点</p>
                <p className="text-gray-900">{reservation.location}</p>
              </div>
              <div>
                <p className="text-gray-500">担当スタッフ</p>
                <p className="text-gray-900">{reservation.staffInCharge || 'なし'}</p>
              </div>
            </div>
          </div>

          {/* 刻印情報 */}
          {(reservation.engravingName || reservation.engravingDate || reservation.fontStyle) && (
            <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-gray-900">刻印情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservation.engravingName && (
                  <div>
                    <p className="text-gray-500">刻印名</p>
                    <p className="text-gray-900">{reservation.engravingName}</p>
                  </div>
                )}
                {reservation.engravingDate && (
                  <div>
                    <p className="text-gray-500">刻印日付</p>
                    <p className="text-gray-900">{reservation.engravingDate}</p>
                  </div>
                )}
                {reservation.fontStyle && (
                  <div>
                    <p className="text-gray-500">書体</p>
                    <p className="text-gray-900">
                      {reservation.fontStyle === 'mincho' ? '明朝体' : reservation.fontStyle === 'gothic' ? 'ゴシック体' : '筆記体'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ステータス */}
          <div className="space-y-4">
            <h3 className="text-gray-900">ステータス</h3>
            
            <div>
              <p className="text-gray-500 mb-2">決済ステータス</p>
              <div className="flex gap-2 flex-wrap">
                {(['unpaid', 'pending', 'paid'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handlePaymentStatusChange(status)}
                    disabled={loading || reservation.paymentStatus === status}
                    className={`px-4 py-2 rounded transition-all ${
                      reservation.paymentStatus === status
                        ? PAYMENT_STATUS_COLORS[status]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {PAYMENT_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gray-500 mb-2">予約ステータス</p>
              <span className={`inline-block px-4 py-2 rounded border-2 ${RESERVATION_STATUS_COLORS[reservation.reservationStatus]}`}>
                {RESERVATION_STATUS_LABELS[reservation.reservationStatus]}
              </span>
            </div>
          </div>

          {/* 備考 */}
          {reservation.note && (
            <div>
              <p className="text-gray-500 mb-2">備考</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{reservation.note}</p>
            </div>
          )}

          {/* メタ情報 */}
          <div className="pt-4 border-t text-gray-500">
            <p>作成日時: {new Date(reservation.createdAt).toLocaleString('ja-JP')}</p>
            {reservation.createdBy && <p>作成者: {reservation.createdBy}</p>}
          </div>

          {/* アクション */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onEdit(reservation)}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              編集
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    削除中...
                  </>
                ) : (
                  '本当に削除しますか？'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
