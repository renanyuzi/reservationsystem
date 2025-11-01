import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Reservation } from '../types/reservation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatisticsViewProps {
  reservations: Reservation[];
}

export function StatisticsView({ reservations }: StatisticsViewProps) {
  // 利用可能な年月のリストを生成
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    reservations.forEach((r) => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    // 現在の月も追加
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    
    return Array.from(months).sort().reverse();
  }, [reservations]);

  // 選択された月（デフォルトは現在の月）
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // 選択された月の予約をフィルタリング
  const selectedMonthReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [reservations, selectedMonth]);

  // 週別型取件数（選択月）
  const getWeeklyData = () => {
    if (selectedMonthReservations.length === 0) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // 週ごとにグループ化
    const weekData: Record<number, number> = {};
    
    selectedMonthReservations.forEach((r) => {
      const date = new Date(r.date);
      const weekNum = Math.ceil(date.getDate() / 7);
      weekData[weekNum] = (weekData[weekNum] || 0) + r.moldCount;
    });

    return Object.entries(weekData)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([week, count]) => ({
        week: `第${week}週`,
        count,
      }));
  };

  // 月別型取件数（過去12ヶ月）
  const getMonthlyData = () => {
    const monthCounts: Record<string, number> = {};
    
    reservations.forEach((r) => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + r.moldCount;
    });

    return Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 最新12ヶ月
      .map(([month, count]) => ({ month, count }));
  };

  // 店舗別型取件数
  const getLocationData = () => {
    const locationCounts: Record<string, number> = {};
    
    reservations.forEach((r) => {
      locationCounts[r.location] = (locationCounts[r.location] || 0) + r.moldCount;
    });

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([location, count]) => ({ location, count }));
  };

  // 決済状況と平均型取り本数
  const getPaymentData = () => {
    const paid = reservations.filter((r) => r.paymentStatus === 'paid');
    const unpaid = reservations.filter((r) => r.paymentStatus === 'unpaid');

    // それぞれの平均型取り本数を計算
    const paidAvg = paid.length > 0 
      ? (paid.reduce((sum, r) => sum + r.moldCount, 0) / paid.length).toFixed(1)
      : '0.0';
    const unpaidAvg = unpaid.length > 0
      ? (unpaid.reduce((sum, r) => sum + r.moldCount, 0) / unpaid.length).toFixed(1)
      : '0.0';

    return {
      pieData: [
        { name: '支払い済み', value: paid.length, color: '#22c55e', avg: paidAvg },
        { name: '未決済', value: unpaid.length, color: '#ef4444', avg: unpaidAvg },
      ].filter((item) => item.value > 0),
      totalAvg: reservations.length > 0
        ? (reservations.reduce((sum, r) => sum + r.moldCount, 0) / reservations.length).toFixed(1)
        : '0.0',
    };
  };

  // 型取り本数統計
  const getMoldStats = () => {
    let total = 0;
    const counts: Record<number, number> = { 1: 0, 2: 0, 4: 0 };

    reservations.forEach((r) => {
      total += r.moldCount;
      counts[r.moldCount] = (counts[r.moldCount] || 0) + 1;
    });

    return {
      total,
      average: reservations.length > 0 ? (total / reservations.length).toFixed(1) : '0',
      distribution: [
        { count: '1本', value: counts[1] },
        { count: '2本', value: counts[2] },
        { count: '4本', value: counts[4] },
      ],
    };
  };

  // 年齢分布統計
  const getAgeDistribution = () => {
    const ageGroups: Record<string, number> = {
      '0-3ヶ月': 0,
      '4-6ヶ月': 0,
      '7-12ヶ月': 0,
      '13-24ヶ月': 0,
      '25ヶ月以上': 0,
    };

    reservations.forEach((r) => {
      if (!r.childAge) return;
      
      if (r.childAge <= 3) ageGroups['0-3ヶ月']++;
      else if (r.childAge <= 6) ageGroups['4-6ヶ月']++;
      else if (r.childAge <= 12) ageGroups['7-12ヶ月']++;
      else if (r.childAge <= 24) ageGroups['13-24ヶ月']++;
      else ageGroups['25ヶ月以上']++;
    });

    return Object.entries(ageGroups)
      .map(([ageGroup, count]) => ({ ageGroup, count }))
      .filter((item) => item.count > 0);
  };

  // 平均年齢
  const getAverageAge = () => {
    const validAges = reservations.filter((r) => r.childAge > 0);
    if (validAges.length === 0) return '0.0';
    
    const totalAge = validAges.reduce((sum, r) => sum + r.childAge, 0);
    return (totalAge / validAges.length).toFixed(1);
  };

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const locationData = getLocationData();
  const paymentData = getPaymentData();
  const moldStats = getMoldStats();
  const ageDistribution = getAgeDistribution();
  const averageAge = getAverageAge();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-gray-900">統計・集計</h1>
        
        {/* 月選択 */}
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

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総予約件数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{reservations.length}</p>
            <p className="text-xs text-gray-500 mt-1">全期間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">選択月の予約</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{selectedMonthReservations.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedMonth.split('-')[0]}年{selectedMonth.split('-')[1]}月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総型取り本数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{moldStats.total}</p>
            <p className="text-xs text-gray-500 mt-1">全期間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">平均型取り本数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{moldStats.average}</p>
            <p className="text-xs text-gray-500 mt-1">予約あたり</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">平均年齢</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-900">{averageAge}</p>
            <p className="text-xs text-gray-500 mt-1">ヶ月</p>
          </CardContent>
        </Card>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 週別型取件数（選択月） */}
        <Card>
          <CardHeader>
            <CardTitle>
              週別型取り本数（{selectedMonth.split('-')[0]}年{selectedMonth.split('-')[1]}月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="型取り本数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                選択月にデータがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 月別型取件数（過去12ヶ月） */}
        <Card>
          <CardHeader>
            <CardTitle>月別型取り本数（過去12ヶ月）</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="型取り本数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 店舗別型取件数 */}
        <Card>
          <CardHeader>
            <CardTitle>店舗別型取り本数</CardTitle>
          </CardHeader>
          <CardContent>
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="型取り本数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 決済状況と平均型取り本数 */}
        <Card>
          <CardHeader>
            <CardTitle>決済状況と平均型取り本数</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.pieData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* 平均型取り本数の詳細 */}
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">全体平均:</span>
                    <span className="text-lg font-semibold text-gray-900">{paymentData.totalAvg}本</span>
                  </div>
                  {paymentData.pieData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: item.color }}>
                        {item.name}平均:
                      </span>
                      <span className="text-sm font-semibold" style={{ color: item.color }}>
                        {item.avg}本
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 型取り本数分布 */}
        <Card>
          <CardHeader>
            <CardTitle>型取り本数別の予約件数</CardTitle>
          </CardHeader>
          <CardContent>
            {moldStats.distribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moldStats.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="count" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" name="予約件数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 年齢分布 */}
        <Card>
          <CardHeader>
            <CardTitle>子供の年齢分布</CardTitle>
          </CardHeader>
          <CardContent>
            {ageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#06b6d4" name="予約件数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
