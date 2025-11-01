import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Plus, Search, BarChart3, Settings, Edit, Loader2, Menu, DollarSign, Users as UsersIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { AddReservationDialog } from './components/AddReservationDialog';
import { CalendarView } from './components/CalendarView';
import { ReservationList } from './components/ReservationList';
import { ReservationDialog } from './components/ReservationDialog';
import { BottomSheet } from './components/BottomSheet';
import { StatisticsView } from './components/StatisticsView';
import { SettingsView } from './components/SettingsView';
import { LoginScreen } from './components/LoginScreen';
import { StaffManagement } from './components/StaffManagement';
import { IncentiveCalculation } from './components/IncentiveCalculation';
import { SearchBar } from './components/SearchBar';
import { useDebounce } from './hooks/useDebounce';
import { useIsMobile } from './components/ui/use-mobile';
import { Reservation, Location, Staff, User } from './types/reservation';
import * as api from './utils/api';
import { formatDateToLocalString } from './utils/dateUtils';
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function App() {
  const isMobile = useIsMobile();

  // 認証状態
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ビュー管理
  const [currentView, setCurrentView] = useState<'calendar' | 'statistics' | 'settings' | 'staff' | 'incentive'>('calendar');
  
  // データ
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // UI状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewSwitching, setIsViewSwitching] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ログイン処理
  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    // セッションストレージに保存（タブを閉じると削除される）
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('authToken', token);
  };

  // ログアウト処理
  const handleLogout = () => {
    console.log('ログアウト処理開始');
    setCurrentUser(null);
    // セッションストレージとトークンをクリア
    api.logout();
    sessionStorage.removeItem('currentUser');
    
    // ビューをリセット
    setCurrentView('calendar');
    setSelectedDate(null);
    setShowAddDialog(false);
    setShowReservationDialog(false);
    setShowBottomSheet(false);
    setShowSearchDialog(false);
    setSelectedReservation(null);
    setEditingReservation(null);
    setSearchQuery('');
    
    console.log('ログアウト完了 - ログイン画面に戻ります');
  };

  // 初期化
  useEffect(() => {
    console.log('🚀 アプリケーション初期化開始');
    
    // 保存されたユーザー情報を読み込み（セッションストレージから）
    const savedUser = sessionStorage.getItem('currentUser');
    const savedToken = sessionStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      console.log('💾 ログイン情報を読み込みました');
      setCurrentUser(JSON.parse(savedUser));
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const loadAllData = async () => {
    try {
      console.log('=== データ読み込み開始 ===');
      const [reservationsData, locationsData, staffData] = await Promise.all([
        api.getReservations(),
        api.getLocations(),
        api.getStaff(),
      ]);

      console.log('予約数:', reservationsData.length);
      console.log('拠点数:', locationsData.length);
      console.log('スタッフ数:', staffData.length);

      setReservations(reservationsData);
      setLocations(locationsData);
      setStaffList(staffData);

      if (currentUser?.role === 'manager') {
        console.log('管理職として追加データを読み込み中...');
        const usersData = await fetchUsers();
        console.log('ユーザー数:', usersData.length);
        setUsers(usersData);
      }
      
      console.log('=== データ読み込み完了 ===');
    } catch (error) {
      console.error('❌ データ読み込みエラー:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/users`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredReservations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return reservations;

    const query = debouncedSearchQuery.toLowerCase();
    return reservations.filter(
      (r) =>
        r.parentName.toLowerCase().includes(query) ||
        r.childName.toLowerCase().includes(query) ||
        r.customerNumber?.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query) ||
        r.staff.toLowerCase().includes(query) ||
        r.notes.toLowerCase().includes(query) ||
        r.id.includes(query)
    );
  }, [reservations, debouncedSearchQuery]);

  const handleAddReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    try {
      const newReservation: Reservation = {
        ...data,
        id: Date.now().toString(),
        childAge: data.childAge || 0,
        customerNumber: data.customerNumber || '',
        status: data.status || 'confirmed',
        createdBy: currentUser?.id || '',
      };

      const created = await api.createReservation(newReservation);
      setReservations((prev) => [...prev, created]);
    } catch (error) {
      console.error('Failed to add reservation:', error);
      alert('予約の追加に失敗しました');
    }
  }, [currentUser]);

  const handleUpdateReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    if (!editingReservation) return;

    try {
      const updated = await api.updateReservation(editingReservation.id, {
        ...data,
        id: editingReservation.id,
      });
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingReservation(null);
    } catch (error) {
      console.error('Failed to update reservation:', error);
      alert('予約の更新に失敗しました');
    }
  }, [editingReservation]);

  const handleDeleteReservation = useCallback(async (id: string) => {
    if (!confirm('この予約を削除してもよろしいですか？')) return;

    try {
      await api.deleteReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      setShowReservationDialog(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Failed to delete reservation:', error);
      alert('予約の削除に失敗しました');
    }
  }, []);

  const handlePaymentStatusToggle = useCallback(async (id: string) => {
    try {
      const updated = await api.togglePaymentStatus(id);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (error) {
      console.error('Failed to toggle payment status:', error);
      alert('決済ステータスの変更に失敗しました');
    }
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (isMobile) {
      setShowBottomSheet(true);
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowReservationDialog(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowAddDialog(true);
  };

  const handleAddLocation = useCallback(async (name: string) => {
    try {
      const newLocation: Location = {
        id: Date.now().toString(),
        name,
      };
      const created = await api.createLocation(newLocation);
      setLocations((prev) => [...prev, created]);
    } catch (error) {
      console.error('Failed to add location:', error);
      alert('拠点の追加に失敗しました');
    }
  }, []);

  const handleDeleteLocation = useCallback(async (id: string) => {
    try {
      await api.deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('拠点の削除に失敗しました');
    }
  }, []);

  const handleAddStaff = useCallback(async (name: string) => {
    try {
      const newStaff: Staff = {
        id: Date.now().toString(),
        name,
      };
      const created = await api.createStaff(newStaff);
      setStaffList((prev) => [...prev, created]);
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('スタッフの追加に失敗しました');
    }
  }, []);

  const handleDeleteStaff = useCallback(async (id: string) => {
    try {
      await api.deleteStaff(id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete staff:', error);
      alert('スタッフの削除に失敗しました');
    }
  }, []);

  const handleSearchResultClick = useCallback((reservation: Reservation) => {
    const date = new Date(reservation.date);
    setCurrentDate(date);
    setSelectedDate(date);
    setCurrentView('calendar');
    setShowSearchDialog(false);
    setSearchQuery('');

    setTimeout(() => {
      handleReservationClick(reservation);
    }, 100);
  }, [handleReservationClick]);

  // ログイン前の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="text-lg font-medium text-gray-900">読み込み中...</p>
            <p className="text-sm text-gray-500 mt-2">
              データを取得しています
            </p>
          </div>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>システムを起動中</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl text-gray-900">予約管理</h1>
              <p className="text-xs text-gray-500">{currentUser.name}さん</p>
            </div>

            {!isMobile && currentView === 'calendar' && (
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="予約を検索..."
                className="flex-1 max-w-md"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={isMobile ? '' : 'ml-auto'}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            {!isMobile && (
              <div className="flex gap-2">
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  disabled={isViewSwitching}
                  onClick={() => {
                    if (currentView !== 'calendar') {
                      console.log('📅 カレンダービューに切り替え - リフレッシュします');
                      setIsViewSwitching(true);
                      localStorage.setItem('targetView', 'calendar');
                      setTimeout(() => window.location.reload(), 50);
                    }
                  }}
                >
                  カレンダー
                </Button>
                {currentUser.role === 'manager' && (
                  <>
                    <Button
                      variant={currentView === 'statistics' ? 'default' : 'ghost'}
                      size="sm"
                      disabled={isViewSwitching}
                      onClick={() => {
                        console.log('📊 統計ビューに切り替え - リフレッシュします');
                        setIsViewSwitching(true);
                        localStorage.setItem('targetView', 'statistics');
                        setTimeout(() => window.location.reload(), 50);
                      }}
                    >
                      {isViewSwitching && localStorage.getItem('targetView') === 'statistics' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4 mr-2" />
                      )}
                      統計
                    </Button>
                    <Button
                      variant={currentView === 'incentive' ? 'default' : 'ghost'}
                      size="sm"
                      disabled={isViewSwitching}
                      onClick={() => {
                        console.log('💰 インセンティブビューに切り替え - リフレッシュします');
                        setIsViewSwitching(true);
                        localStorage.setItem('targetView', 'incentive');
                        setTimeout(() => window.location.reload(), 50);
                      }}
                    >
                      {isViewSwitching && localStorage.getItem('targetView') === 'incentive' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-2" />
                      )}
                      インセンティブ
                    </Button>
                    <Button
                      variant={currentView === 'staff' ? 'default' : 'ghost'}
                      size="sm"
                      disabled={isViewSwitching}
                      onClick={() => {
                        console.log('👥 スタッフ管理ビューに切り替え - リフレッシュします');
                        setIsViewSwitching(true);
                        localStorage.setItem('targetView', 'staff');
                        setTimeout(() => window.location.reload(), 50);
                      }}
                    >
                      {isViewSwitching && localStorage.getItem('targetView') === 'staff' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UsersIcon className="w-4 h-4 mr-2" />
                      )}
                      スタッフ管理
                    </Button>
                  </>
                )}
                <Button
                  variant={currentView === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  disabled={isViewSwitching}
                  onClick={() => {
                    console.log('⚙️ 設定ビューに切り替え - リフレッシュします');
                    setIsViewSwitching(true);
                    localStorage.setItem('targetView', 'settings');
                    setTimeout(() => window.location.reload(), 50);
                  }}
                >
                  {isViewSwitching && localStorage.getItem('targetView') === 'settings' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  設定
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={isViewSwitching}>
                  ログアウト
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={isMobile ? 'pb-4' : 'pb-4'}>
        {(isMobile || currentView === 'calendar') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <CalendarView
              currentDate={currentDate}
              selectedDate={selectedDate}
              reservations={searchQuery ? filteredReservations : reservations}
              onDateSelect={handleDateSelect}
              onMonthChange={setCurrentDate}
            />

            {!isMobile && (
              <ReservationList
                selectedDate={selectedDate}
                reservations={searchQuery ? filteredReservations : reservations}
                onReservationClick={editMode ? handleEditReservation : handleReservationClick}
                onPaymentStatusToggle={handlePaymentStatusToggle}
                editMode={editMode}
                onToggleEditMode={() => setEditMode(!editMode)}
              />
            )}
          </div>
        )}

        {!isMobile && currentView === 'statistics' && currentUser.role === 'manager' && (
          <StatisticsView reservations={reservations} />
        )}

        {!isMobile && currentView === 'incentive' && currentUser.role === 'manager' && (
          <div className="p-4">
            {users.length > 0 ? (
              <IncentiveCalculation reservations={reservations} users={users} />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <p>ユーザー情報を読み込み中...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isMobile && currentView === 'staff' && currentUser.role === 'manager' && (
          <StaffManagement />
        )}

        {!isMobile && currentView === 'settings' && (
          <SettingsView
            locations={locations}
            staffList={staffList}
            currentUser={currentUser}
            onAddLocation={handleAddLocation}
            onDeleteLocation={handleDeleteLocation}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onUserUpdate={loadUsers}
          />
        )}
      </main>

      {/* モバイル用ボトムシート */}
      {isMobile && (
        <BottomSheet isOpen={showBottomSheet} onClose={() => setShowBottomSheet(false)}>
          <div>
            <div className="px-5 pt-2 pb-4 border-b bg-gradient-to-b from-gray-50 to-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedDate && `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`}の予約
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDate && reservations.filter((r) => r.date === formatDateToLocalString(selectedDate)).length}件
                </p>
              </div>
              <Button
                variant={editMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                {editMode ? '完了' : '編集'}
              </Button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {selectedDate && (
                <>
                  {reservations
                    .filter((r) => r.date === formatDateToLocalString(selectedDate))
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((reservation) => (
                      <div
                        key={reservation.id}
                        onClick={() => {
                          if (editMode) {
                            handleEditReservation(reservation);
                            setShowBottomSheet(false);
                          } else {
                            handleReservationClick(reservation);
                            setShowBottomSheet(false);
                          }
                        }}
                        className="border rounded-lg p-4 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {reservation.time}
                            </span>
                            <span className="text-xs text-gray-500">
                              {reservation.duration}分
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {reservation.status === 'standby' && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                待機中
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                reservation.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {reservation.paymentStatus === 'paid' ? '済' : '未'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{reservation.parentName}</p>
                        {reservation.childName && (
                          <p className="text-xs text-gray-500">
                            お子様: {reservation.childName}
                            {reservation.childAge > 0 && ` (${reservation.childAge}ヶ月)`}
                          </p>
                        )}
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* FAB */}
      {!isMobile && currentView === 'calendar' && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            setEditingReservation(null);
            setShowAddDialog(true);
          }}
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {isMobile && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => {
            setEditingReservation(null);
            setShowAddDialog(true);
          }}
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* ダイアログ */}
      <AddReservationDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingReservation(null);
        }}
        onSave={editingReservation ? handleUpdateReservation : handleAddReservation}
        initialDate={selectedDate || undefined}
        editingReservation={editingReservation}
        locations={locations}
        staffList={staffList}
      />

      {selectedReservation && (
        <ReservationDialog
          open={showReservationDialog}
          reservation={selectedReservation}
          onClose={() => {
            setShowReservationDialog(false);
            setSelectedReservation(null);
          }}
          onEdit={() => {
            setShowReservationDialog(false);
            handleEditReservation(selectedReservation);
          }}
          onDelete={() => handleDeleteReservation(selectedReservation.id)}
          onPaymentToggle={() => handlePaymentStatusToggle(selectedReservation.id)}
        />
      )}
    </div>
  );
}
