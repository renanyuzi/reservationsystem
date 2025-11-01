import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Reservation } from '../types/reservation';
import { Clock, User, Users, MapPin, Calendar, FileText, CreditCard, Edit, Trash2 } from 'lucide-react';

interface ReservationDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
  onPaymentStatusToggle: (id: string) => void;
}

export function ReservationDialog({
  reservation,
  open,
  onClose,
  onEdit,
  onDelete,
  onPaymentStatusToggle,
}: ReservationDialogProps) {
  if (!reservation) return null;

  const getPaymentBadge = () => {
    if (reservation.paymentStatus === 'paid') {
      return (
        <Badge className="bg-green-500 text-white cursor-pointer hover:bg-green-600">
          支払い済み
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500 text-white cursor-pointer hover:bg-red-600">
          未決済
        </Badge>
      );
    }
  };

  const handleDelete = () => {
    if (window.confirm('この予約を削除しますか？')) {
      onDelete(reservation.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>予約詳細</DialogTitle>
          <DialogDescription>予約の詳細情報を確認・編集できます</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 予約者情報 */}
          <div>
            <h3 className="text-gray-900 mb-2">
              {reservation.parentName}
              {reservation.childName && ` / ${reservation.childName}`}
            </h3>
          </div>

          <Separator />

          {/* 詳細情報 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">日付</p>
                <p className="text-gray-900">{reservation.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">時間</p>
                <p className="text-gray-900">
                  {reservation.time} ({reservation.duration}分)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">型取り本数</p>
                <p className="text-gray-900">{reservation.moldCount}本</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">拠点</p>
                <p className="text-gray-900">{reservation.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">担当スタッフ</p>
                <p className="text-gray-900">{reservation.staff}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onPaymentStatusToggle(reservation.id)}
            >
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">決済ステータス</p>
                <div className="mt-1">{getPaymentBadge()}</div>
              </div>
            </div>

            {reservation.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">備考</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{reservation.notes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(reservation)}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
