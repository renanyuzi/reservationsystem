import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Reservation, User } from '../types/reservation';
import { Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';

interface IncentiveCalculationProps {
  reservations: Reservation[];
  users: User[];
}

// 1件あたりの固定報酬
const INCENTIVE_PER_RESERVATION = 1000; // 1件 = 1,000円

export function IncentiveCalculation({ reservations, users }: IncentiveCalculationProps) {
  console.log('IncentiveCalculation レンダリング:', { 
    reservationsCount: reservations.length, 
    usersCount: users.length 
  });
  
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // スタッフのみフィルタリング（管理者を除外）
  const staffUsers = useMemo(() => {
    return users.filter((u) => u.role === 'staff');
  }, [users]);

  // 利用可能な年月リスト
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    reservations.forEach((r) => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    months.add(defaultMonth);
    return Array.from(months).sort().reverse();
  }, [reservations, defaultMonth]);

  // 選択月のカレンダー情報を生成
  const calendarData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return {
      year,
      month,
      daysInMonth,
      startDayOfWeek,
      firstDay,
      lastDay,
    };
  }, [selectedMonth]);

  // 日付ごとのスタッフ別予約数を計算
  const dailyStaffReservations = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};

    reservations.forEach((r) => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthKey === selectedMonth && r.status === 'confirmed') {
        const day = date.getDate();
        const dayKey = `${day}`;
        
        if (!data[dayKey]) {
          data[dayKey] = {};
        }
        
        if (!data[dayKey][r.createdBy]) {
          data[dayKey][r.createdBy] = 0;
        }
        
        data[dayKey][r.createdBy]++;
      }
    });

    return data;
  }, [reservations, selectedMonth]);

  // スタッフごとの月間合計
  const staffMonthlyTotals = useMemo(() => {
    const totals: Record<string, { name: string; count: number; incentive: number }> = {};

    staffUsers.forEach((staff) => {
      totals[staff.id] = {
        name: staff.name,
        count: 0,
        incentive: 0,
      };
    });

    Object.values(dailyStaffReservations).forEach((dayData) => {
      Object.entries(dayData).forEach(([staffId, count]) => {
        if (totals[staffId]) {
          totals[staffId].count += count;
          totals[staffId].incentive += count * INCENTIVE_PER_RESERVATION;
        }
      });
    });

    return totals;
  }, [staffUsers, dailyStaffReservations]);

  const totalReservations = Object.values(staffMonthlyTotals).reduce((sum, s) => sum + s.count, 0);
  const totalIncentives = Object.values(staffMonthlyTotals).reduce((sum, s) => sum + s.incentive, 0);

  // スタッフカラーマッピング
  const staffColors = useMemo(() => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    const mapping: Record<string, string> = {};
    staffUsers.forEach((staff, index) => {
      mapping[staff.id] = colors[index % colors.length];
    });
    return mapping;
  }, [staffUsers]);

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const days = [];
    const { startDayOfWeek, daysInMonth } = calendarData;

    // 前月の空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [calendarData]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">スタッフ獲得実績</h1>
          <p className="text-sm text-gray-500 mt-1">
            スタッフごとの予約獲得状況をカレンダーで確認（1件あたり ¥{INCENTIVE_PER_RESERVATION.toLocaleString()}）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">対象月:</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => {
                const [year, monthNum] = month.split('-');
                return (
                  <SelectItem key={month} value={month}>
                    {year}年{monthNum}月
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総予約獲得数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{totalReservations}件</p>
            <p className="text-xs text-gray-500 mt-1">
              {calendarData.year}年{calendarData.month}月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総インセンティブ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">¥{totalIncentives.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">確定予約のみ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">スタッフ平均</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">
              {staffUsers.length > 0
                ? Math.round(totalReservations / staffUsers.length)
                : 0}件
            </p>
            <p className="text-xs text-gray-500 mt-1">1人あたり</p>
          </CardContent>
        </Card>
      </div>

      {/* スタッフ凡例 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">スタッフ別 月間獲得実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffUsers.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${staffColors[staff.id]}`} />
                  <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {staffMonthlyTotals[staff.id]?.count || 0}件
                  </p>
                  <p className="text-xs text-gray-500">
                    ¥{(staffMonthlyTotals[staff.id]?.incentive || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* カレンダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <CardTitle>
              {calendarData.year}年{calendarData.month}月 獲得カレンダー
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー本体 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isToday = day && 
                calendarData.year === today.getFullYear() &&
                calendarData.month === today.getMonth() + 1 &&
                day === today.getDate();

              const dayData = day ? dailyStaffReservations[`${day}`] : null;
              const totalForDay = dayData 
                ? Object.values(dayData).reduce((sum, count) => sum + count, 0)
                : 0;

              return (
                <div
                  key={index}
                  className={`min-h-[80px] border rounded-lg p-2 ${
                    !day
                      ? 'bg-gray-50'
                      : isToday
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm ${
                            isToday
                              ? 'font-bold text-blue-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {day}
                        </span>
                        {totalForDay > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {totalForDay}
                          </Badge>
                        )}
                      </div>
                      {dayData && (
                        <div className="space-y-1">
                          {Object.entries(dayData).map(([staffId, count]) => {
                            const staff = staffUsers.find((s) => s.id === staffId);
                            if (!staff) return null;
                            return (
                              <div
                                key={staffId}
                                className={`flex items-center justify-between px-1.5 py-0.5 rounded text-white text-xs ${staffColors[staffId]}`}
                              >
                                <span className="truncate">{staff.name.substring(0, 4)}</span>
                                <span className="font-bold">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {staffUsers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-400">スタッフが登録されていません</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
