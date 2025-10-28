import { Clock, User, Users, MapPin, CreditCard } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Reservation } from '../types/reservation';

interface ReservationCardProps {
  reservation: Reservation;
  onClick: () => void;
  onPaymentStatusToggle: (id: string) => void;
}

export function ReservationCard({ reservation, onClick, onPaymentStatusToggle }: ReservationCardProps) {
  const getPaymentBadge = () => {
    if (reservation.paymentStatus === 'paid') {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          支払い済み
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500 text-white hover:bg-red-600">
          未決済
        </Badge>
      );
    }
  };

  const handlePaymentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPaymentStatusToggle(reservation.id);
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-gray-900 mb-1">
            {reservation.parentName}
            {reservation.childName && ` / ${reservation.childName}`}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {reservation.time} ({reservation.duration}分)
            </span>
          </div>
        </div>
        <div onClick={handlePaymentClick}>
          {getPaymentBadge()}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>型取り: {reservation.moldCount}本</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{reservation.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>担当: {reservation.staff}</span>
        </div>
      </div>

      {reservation.notes && (
        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
          <p className="line-clamp-2">{reservation.notes}</p>
        </div>
      )}
    </Card>
  );
}
