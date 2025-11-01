import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  parentName: string;
  childName: string;
  customerId: string;
  moldCount: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  progressStatus: 'waiting' | 'in-progress' | 'completed';
  location: string;
  staffInCharge: string;
  note: string;
}

interface StatisticsViewProps {
  reservations: Reservation[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export function StatisticsView({ reservations }: StatisticsViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  // 対象月の予約データ
  const monthReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = new Date(r.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [reservations, year, month]);

  // 週別型取り件数推移
  const weeklyData = useMemo(() => {
    const weeks: { [key: string]: number } = {};
    
    monthReservations.forEach((r) => {
      const date = new Date(r.date);
      const weekNum = Math.ceil(date.getDate() / 7);
      const key = `第${weekNum}週`;
      weeks[key] = (weeks[key] || 0) + r.moldCount;
    });

    return Object.entries(weeks).map(([week, count]) => ({ week, count }));
  }, [monthReservations]);

  // 店舗別件数ランキング
  const locationStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    monthReservations.forEach((r) => {
      stats[r.location] = (stats[r.location] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [monthReservations]);

  // 売上・インセンティブ計算
  const calculateRevenue = (moldCount: number): number => {
    if (moldCount === 1) return 15000;
    if (moldCount >= 2) return 20000;
    return 0;
  };

  const INCENTIVE_PER_RESERVATION = 1000;

  // 決済ステータス別統計
  const paymentStats = useMemo(() => {
    const stats = {
      paid: { count: 0, totalMoldCount: 0, revenue: 0 },
      unpaid: { count: 0, totalMoldCount: 0, revenue: 0 },
      pending: { count: 0, totalMoldCount: 0, revenue: 0 },
    };

    monthReservations.forEach((r) => {
      stats[r.paymentStatus].count++;
      stats[r.paymentStatus].totalMoldCount += r.moldCount;
      stats[r.paymentStatus].revenue += calculateRevenue(r.moldCount);
    });

    return [
      {
        status: '支払済',
        count: stats.paid.count,
        avgMoldCount: stats.paid.count > 0 ? (stats.paid.totalMoldCount / stats.paid.count).toFixed(1) : 0,
        revenue: stats.paid.revenue,
      },
      {
        status: '未決済',
        count: stats.unpaid.count,
        avgMoldCount: stats.unpaid.count > 0 ? (stats.unpaid.totalMoldCount / stats.unpaid.count).toFixed(1) : 0,
        revenue: stats.unpaid.revenue,
      },
      {
        status: '保留',
        count: stats.pending.count,
        avgMoldCount: stats.pending.count > 0 ? (stats.pending.totalMoldCount / stats.pending.count).toFixed(1) : 0,
        revenue: stats.pending.revenue,
      },
    ];
  }, [monthReservations]);

  // 総売上とインセンティブ
  const totalStats = useMemo(() => {
    const totalRevenue = monthReservations.reduce((sum, r) => sum + calculateRevenue(r.moldCount), 0);
    const totalIncentive = monthReservations.length * INCENTIVE_PER_RESERVATION;
    return { totalRevenue, totalIncentive };
  }, [monthReservations]);

  // 型取り本数統計
  const moldCountStats = useMemo(() => {
    const total = monthReservations.reduce((sum, r) => sum + r.moldCount, 0);
    const avg = monthReservations.length > 0 ? (total / monthReservations.length).toFixed(1) : 0;

    const distribution: { [key: number]: number } = {};
    monthReservations.forEach((r) => {
      distribution[r.moldCount] = (distribution[r.moldCount] || 0) + 1;
    });

    const distributionData = Object.entries(distribution)
      .map(([count, freq]) => ({ count: `${count}本`, freq }))
      .sort((a, b) => parseInt(a.count) - parseInt(b.count));

    return { total, avg, distribution: distributionData };
  }, [monthReservations]);

  // 日別型取り推移
  const dailyData = useMemo(() => {
    const days: { [key: string]: number } = {};
    
    monthReservations.forEach((r) => {
      const date = new Date(r.date);
      const day = date.getDate();
      const key = `${day}日`;
      days[key] = (days[key] || 0) + r.moldCount;
    });

    return Object.entries(days)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [monthReservations]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-gray-900">統計ダッシュボード</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-900">
                {year}年 {month + 1}月
              </span>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <p className="text-gray-600">総予約件数</p>
            </div>
            <p className="text-gray-900">{monthReservations.length}件</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-purple-600" />
              <p className="text-gray-600">型取り総数</p>
            </div>
            <p className="text-gray-900">{moldCountStats.total}本</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <p className="text-gray-600">平均型取り本数</p>
            </div>
            <p className="text-gray-900">{moldCountStats.avg}本</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <p className="text-green-100">総売上</p>
            </div>
            <p className="text-2xl">¥{totalStats.totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <p className="text-blue-100">インセンティブ</p>
            </div>
            <p className="text-2xl">¥{totalStats.totalIncentive.toLocaleString()}</p>
          </div>
        </div>

        {/* グラフ1: 日別型取り推移 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">日別型取り推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#6366f1" name="型取り本数" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* グラフ2: 週別型取り件数 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">週別型取り件数</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="型取り本数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* グラフ3: 店舗別件数ランキング */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-900 mb-4">店舗別件数ランキング</h3>
            {locationStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="location" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" name="予約件数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">データがありません</p>
            )}
          </div>

          {/* グラフ4: 型取り本数分布 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-900 mb-4">型取り本数分布</h3>
            {moldCountStats.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moldCountStats.distribution}
                    dataKey="freq"
                    nameKey="count"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {moldCountStats.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">データがありません</p>
            )}
          </div>
        </div>

        {/* テーブル: 決済ステータス別統計 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">決済ステータス別統計</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">ステータス</th>
                  <th className="px-6 py-3 text-left text-gray-700">件数</th>
                  <th className="px-6 py-3 text-left text-gray-700">平均型取り本数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentStats.map((stat) => (
                  <tr key={stat.status} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{stat.status}</td>
                    <td className="px-6 py-4 text-gray-900">{stat.count}件</td>
                    <td className="px-6 py-4 text-gray-900">{stat.avgMoldCount}本</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
