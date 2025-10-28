import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Printer } from 'lucide-react';
import { Reservation } from '../types/reservation';
import { formatDateToLocalString } from '../utils/dateUtils';

interface PrintViewProps {
  reservations: Reservation[];
}

export function PrintView({ reservations }: PrintViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePrint = () => {
    const filteredReservations = reservations.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });

    if (filteredReservations.length === 0) {
      alert('該当する予約がありません');
      return;
    }

    // 印刷用のウィンドウを開く
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>予約リスト印刷</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
            }
            .paid { color: green; }
            .unpaid { color: red; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>予約リスト</h1>
          ${startDate || endDate ? `<p>期間: ${startDate || '開始'} 〜 ${endDate || '終了'}</p>` : ''}
          <p>総件数: ${filteredReservations.length}件</p>
          
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>時間</th>
                <th>親名</th>
                <th>子名</th>
                <th>型取り本数</th>
                <th>拠点</th>
                <th>担当</th>
                <th>決済</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReservations
                .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                .map(
                  (r) => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.time}</td>
                  <td>${r.parentName}</td>
                  <td>${r.childName}</td>
                  <td>${r.moldCount}本</td>
                  <td>${r.location}</td>
                  <td>${r.staff}</td>
                  <td class="${r.paymentStatus}">
                    ${r.paymentStatus === 'paid' ? '済' : r.paymentStatus === 'unpaid' ? '未' : '-'}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl text-gray-900">印刷</h1>

      <Card>
        <CardHeader>
          <CardTitle>予約リスト印刷</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handlePrint} className="w-full md:w-auto">
            <Printer className="w-4 h-4 mr-2" />
            印刷プレビュー
          </Button>

          <p className="text-sm text-gray-500">
            期間を指定しない場合は、すべての予約が印刷されます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
