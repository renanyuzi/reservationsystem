import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { CalendarView } from './components/CalendarView';
import { StatisticsView } from './components/StatisticsView';
import { IncentiveView } from './components/IncentiveView';
import { StaffManagement } from './components/StaffManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { SettingsView } from './components/SettingsView';
import { api } from './utils/api';
import { Calendar, BarChart3, TrendingUp, Users, Settings, LogOut, Loader2, UserCircle } from 'lucide-react';

interface User {
  name: string;
  staffId: string;
  role: 'admin' | 'staff';
}

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
  createdBy: string;
  createdAt: string;
}

type View = 'calendar' | 'statistics' | 'incentive' | 'staff-management' | 'customer-management' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reservationsResult, locationsResult, staffResult] = await Promise.all([
        api.getReservations(),
        api.getLocations(),
        api.getStaff(),
      ]);

      setReservations(reservationsResult.reservations);
      setLocations(locationsResult.locations);
      setStaff(staffResult.staff);
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      alert('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    try {
      const [locationsResult, staffResult] = await Promise.all([
        api.getLocations(),
        api.getStaff(),
      ]);

      setLocations(locationsResult.locations);
      setStaff(staffResult.staff);
    } catch (err) {
      console.error('マスターデータ読み込みエラー:', err);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('calendar');
    setReservations([]);
    setLocations([]);
    setStaff([]);
  };

  const handleReservationChange = async () => {
    await loadData();
  };

  const handleUpdateReservation = async (id: string, data: any) => {
    await api.updateReservation(id, data);
  };

  const handleUserUpdate = (user: User) => {
    setCurrentUser(user);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-gray-900">予約管理システム</h1>
              <nav className="flex gap-2">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    currentView === 'calendar'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">カレンダー</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => setCurrentView('statistics')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentView === 'statistics'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">統計</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('incentive')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentView === 'incentive'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden sm:inline">インセンティブ</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('staff-management')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentView === 'staff-management'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">スタッフ</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('customer-management')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentView === 'customer-management'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">顧客</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    currentView === 'settings'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">設定</span>
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-gray-900">{currentUser.name}</p>
                <p className="text-gray-500">
                  {currentUser.role === 'admin' ? '管理者' : 'スタッフ'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden">
        {loading && currentView === 'calendar' ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {currentView === 'calendar' && (
              <CalendarView
                reservations={reservations}
                locations={locations}
                staff={staff}
                onReservationChange={handleReservationChange}
                onUpdateReservation={handleUpdateReservation}
                onRefreshMasters={loadMasters}
              />
            )}

            {currentView === 'statistics' && isAdmin && (
              <StatisticsView reservations={reservations} />
            )}

            {currentView === 'incentive' && isAdmin && (
              <IncentiveView reservations={reservations} staff={staff} />
            )}

            {currentView === 'staff-management' && isAdmin && <StaffManagement />}

            {currentView === 'customer-management' && isAdmin && <CustomerManagement />}

            {currentView === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                onUserUpdate={handleUserUpdate}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
