import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Reservation, Location, Staff } from '../types/reservation';
import { getTimeOptions, getDurationOptions, formatDateToLocalString } from '../utils/dateUtils';

interface AddReservationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reservation, 'id'>) => void;
  initialDate?: Date;
  editingReservation?: Reservation | null;
  locations: Location[];
  staffList: Staff[];
}

// 初期フォームデータを生成する関数
const getInitialFormData = (initialDate?: Date) => ({
  date: initialDate ? formatDateToLocalString(initialDate) : formatDateToLocalString(new Date()),
  time: '10:00',
  duration: 30,
  parentName: '',
  childName: '',
  childAge: 0,
  customerNumber: '',
  moldCount: 1 as 1 | 2 | 4,
  paymentStatus: 'unpaid' as 'paid' | 'unpaid',
  status: 'confirmed' as 'confirmed' | 'standby',
  location: '',
  staff: '',
  notes: '',
});

export function AddReservationDialog({
  open,
  onClose,
  onSave,
  initialDate,
  editingReservation,
  locations,
  staffList,
}: AddReservationDialogProps) {
  const timeOptions = getTimeOptions();
  const durationOptions = getDurationOptions();

  const [formData, setFormData] = useState(getInitialFormData(initialDate));

  // editingReservationが変更されたら、フォームを更新
  useEffect(() => {
    if (editingReservation) {
      console.log('編集モード：データをセット', editingReservation);
      setFormData({
        date: editingReservation.date,
        time: editingReservation.time,
        duration: editingReservation.duration,
        parentName: editingReservation.parentName,
        childName: editingReservation.childName,
        childAge: editingReservation.childAge || 0,
        customerNumber: editingReservation.customerNumber || '',
        moldCount: editingReservation.moldCount,
        paymentStatus: editingReservation.paymentStatus,
        status: editingReservation.status || 'confirmed',
        location: editingReservation.location,
        staff: editingReservation.staff,
        notes: editingReservation.notes,
      });
    } else if (open) {
      // 新規作成モードでダイアログが開いた時
      console.log('新規作成モード：フォームをリセット');
      setFormData(getInitialFormData(initialDate));
    }
  }, [editingReservation, open, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.parentName.trim()) {
      alert('親名を入力してください');
      return;
    }
    if (!formData.location) {
      alert('拠点を選択してください');
      return;
    }
    if (!formData.staff) {
      alert('担当スタッフを選択してください');
      return;
    }

    console.log('保存データ:', formData);
    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingReservation ? '予約編集' : '新規予約'}</DialogTitle>
          <DialogDescription>
            {editingReservation ? '予約情報を編集します' : '新しい予約を追加します'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 親名 */}
          <div>
            <Label htmlFor="parentName">親名 *</Label>
            <Input
              id="parentName"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              placeholder="例: 山田花子"
              required
            />
          </div>

          {/* 子名と年齢 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="childName">子名</Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                placeholder="例: 太郎"
              />
            </div>
            
            <div>
              <Label htmlFor="childAge">年齢（ヶ月）</Label>
              <Input
                id="childAge"
                type="number"
                min="0"
                max="120"
                value={formData.childAge || ''}
                onChange={(e) => setFormData({ ...formData, childAge: Number(e.target.value) || 0 })}
                placeholder="例: 6"
              />
            </div>
          </div>

          {/* 顧客番号 */}
          <div>
            <Label htmlFor="customerNumber">顧客番号</Label>
            <Input
              id="customerNumber"
              value={formData.customerNumber}
              onChange={(e) => setFormData({ ...formData, customerNumber: e.target.value })}
              placeholder="例: C20251030001"
            />
          </div>

          {/* 日付 */}
          <div>
            <Label htmlFor="date">日付 *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* 時間と所要時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">時間 *</Label>
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger id="time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">所要時間 *</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(value) => setFormData({ ...formData, duration: Number(value) })}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={String(duration)}>
                      {duration}分
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 型取り本数 */}
          <div>
            <Label htmlFor="moldCount">型取り本数 *</Label>
            <Select
              value={String(formData.moldCount)}
              onValueChange={(value) => setFormData({ ...formData, moldCount: Number(value) as 1 | 2 | 4 })}
            >
              <SelectTrigger id="moldCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1本</SelectItem>
                <SelectItem value="2">2本</SelectItem>
                <SelectItem value="4">4本</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 決済ステータス */}
          <div>
            <Label htmlFor="paymentStatus">決済ステータス</Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as 'paid' | 'unpaid' })}
            >
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">未決済</SelectItem>
                <SelectItem value="paid">支払い済み</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 拠点 */}
          <div>
            <Label htmlFor="location">拠点 *</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger id="location">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 担当スタッフ */}
          <div>
            <Label htmlFor="staff">担当スタッフ *</Label>
            <Select value={formData.staff} onValueChange={(value) => setFormData({ ...formData, staff: value })}>
              <SelectTrigger id="staff">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 備考 */}
          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="特記事項があれば入力してください"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit">{editingReservation ? '更新' : '追加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
