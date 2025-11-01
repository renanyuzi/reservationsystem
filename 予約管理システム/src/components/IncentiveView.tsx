import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, Award } from 'lucide-react';

interface Reservation {
  id: string;
  date: string;
  staffInCharge: string;
  moldCount: number;
}

interface IncentiveViewProps {
  reservations: Reservation[];
  staff: string[];
}

const INCENTIVE_PER_RESERVATION = 1000;
const STAFF_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
  '#f97316', '#ef4444', '#14b8a6', '#a855f7',
];

export function IncentiveView({ reservations, staff }: IncentiveViewProps) {
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

  // スタッフ別獲得実績
  const staffStats = useMemo(() => {
    const stats: { [key: string]: number } = {};

    monthReservations.forEach((r) => {
      stats[r.staffInCharge] = (stats[r.staffInCharge] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([name, count]) => ({
        name,
        count,
        incentive: count * INCENTIVE_PER_RESERVATION,
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthReservations]);

  // カレンダー用の日別スタッフ実績
  const dailyStaffReservations = useMemo(() => {
    const dailyData: {
      [day: number]: { [staff: string]: number };
    } = {};

    monthReservations.forEach((r) => {
      const date = new Date(r.date);
      const day = date.getDate();

      if (!dailyData[day]) {
        dailyData[day] = {};
      }

      dailyData[day][r.staffInCharge] = (dailyData[day][r.staffInCharge] || 0) + 1;
    });

    return dailyData;
  }, [monthReservations]);

  // カレンダーの日付配列
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth();
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  // スタッフごとの色マッピング
  const staffColorMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    staff.forEach((s, i) => {
      map[s] = STAFF_COLORS[i % STAFF_COLORS.length];
    });
    return map;
  }, [staff]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-gray-900">インセンティブ管理</h1>
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

        {/* スタッフ別サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffStats.map((stat, index) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-lg p-6 border-l-4"
              style={{ borderLeftColor: staffColorMap[stat.name] }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award
                    className="w-8 h-8"
                    style={{ color: staffColorMap[stat.name] }}
                  />
                  <h3 className="text-gray-900">{stat.name}</h3>
                </div>
                {index === 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                    1位
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">獲得件数</span>
                  <span className="text-gray-900">{stat.count}件</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">インセンティブ</span>
                  <span className="text-indigo-600">
                    ¥{stat.incentive.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* スタッフ凡例 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">スタッフ凡例</h3>
          <div className="flex flex-wrap gap-4">
            {staff.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: staffColorMap[s] }}
                />
                <span className="text-gray-700">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* カレンダーヒートマップ */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">日別スタッフ獲得実績</h3>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((day, i) => (
              <div
                key={i}
                className={`text-center py-2 ${
                  i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, i) => {
              if (!date) {
                return <div key={i} className="aspect-square" />;
              }

              const day = date.getDate();
              const dayStats = dailyStaffReservations[day] || {};
              const totalReservations = Object.values(dayStats).reduce(
                (sum: number, count) => sum + (count as number),
                0
              );

              return (
                <div
                  key={i}
                  className="aspect-square border border-gray-200 rounded-lg p-2 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col h-full">
                    <span className="text-gray-900 mb-1">{day}</span>
                    {totalReservations > 0 ? (
                      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                        {Object.entries(dayStats)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 3)
                          .map(([staffName, count]) => (
                            <div
                              key={staffName}
                              className="flex items-center gap-1"
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: staffColorMap[staffName] }}
                              />
                              <span className="text-gray-700 truncate">
                                {count}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-gray-400">-</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* インセンティブ基準 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800">インセンティブ基準</p>
          </div>
          <p className="text-blue-700">1件あたり ¥{INCENTIVE_PER_RESERVATION.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
