import { useState, useMemo, useEffect, useCallback } from 'react';
import { CalendarView } from './components/CalendarView';
import { ReservationList } from './components/ReservationList';
import { ReservationDialog } from './components/ReservationDialog';
import { AddReservationDialog } from './components/AddReservationDialog';
import { StatisticsView } from './components/StatisticsView';
import { SettingsView } from './components/SettingsView';
import { SearchBar } from './components/SearchBar';
import { BottomSheet } from './components/BottomSheet';
import { Button } from './components/ui/button';
import { useIsMobile } from './components/ui/use-mobile';
import { Reservation, Location, Staff } from './types/reservation';
import { formatDateToLocalString } from './utils/dateUtils';
import { Calendar, BarChart3, Settings, Plus, Search, RefreshCw, Loader2, Edit, User, Users, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { useDebounce } from './hooks/useDebounce';
import * as api from './utils/api';

export default function App() {
  const isMobile = useIsMobile();

  // データ状態
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  // モバイル版は常にカレンダー表示、デスクトップのみ切り替え可能
  const [currentView, setCurrentView] = useState<'calendar' | 'statistics' | 'settings'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // ダイアログ状態
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // デバウンス検索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 初期データ読み込み
  useEffect(() => {
    loadAllData();
  }, []);

  // データ読み込み関数
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // 初期セットアップを実行（データが無い場合のみサンプルデータを設定）
      await api.setupInitialData();

      // 全データを並列で取得
      const [reservationsData, locationsData, staffData] = await Promise.all([
        api.fetchReservations(),
        api.fetchLocations(),
        api.fetchStaff(),
      ]);

      setReservations(reservationsData);
      setLocations(locationsData);
      setStaffList(staffData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('データの読み込みに失敗しました。ページを再読み込みしてください。');
    } finally {
      setIsLoading(false);
    }
  };

  // リフレッシュ関数
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 検索機能（メモ化）
  const filteredReservations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return reservations;

    const query = debouncedSearchQuery.toLowerCase();
    return reservations.filter(
      (r) =>
        r.parentName.toLowerCase().includes(query) ||
        r.childName.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query) ||
        r.staff.toLowerCase().includes(query) ||
        r.notes.toLowerCase().includes(query) ||
        r.id.includes(query)
    );
  }, [reservations, debouncedSearchQuery]);

  // 予約追加（useCallbackでメモ化）
  const handleAddReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    try {
      const newReservation: Reservation = {
        ...data,
        id: Date.now().toString(),
        childAge: data.childAge || 0,
      };
      
      const created = await api.createReservation(newReservation);
      setReservations((prev) => [...prev, created]);
    } catch (error) {
      console.error('Failed to add reservation:', error);
      alert('予約の追加に失敗しました');
    }
  }, []);

  // 予約更新（useCallbackでメモ化）
  const handleUpdateReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    if (!editingReservation) return;
    
    try {
      const updated = await api.updateReservation(editingReservation.id, data);
      setReservations((prev) =>
        prev.map((r) => (r.id === editingReservation.id ? updated : r))
      );
      setEditingReservation(null);
    } catch (error) {
      console.error('Failed to update reservation:', error);
      alert('予約の更新に失敗しました');
    }
  }, [editingReservation]);

  // 予約削除（useCallbackでメモ化）
  const handleDeleteReservation = useCallback(async (id: string) => {
    try {
      await api.deleteReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to delete reservation:', error);
      alert('予約の削除に失敗しました');
    }
  }, []);

  // 決済ステータストグル（useCallbackでメモ化）
  const handlePaymentStatusToggle = useCallback(async (id: string) => {
    try {
      const updated = await api.togglePaymentStatus(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (error) {
      console.error('Failed to toggle payment status:', error);
      alert('決済ステータスの更新に失敗しました');
    }
  }, []);

  // 予約クリック
  const handleReservationClick = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailDialog(true);
  }, []);

  // 編集開始
  const handleEditReservation = useCallback((reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowDetailDialog(false);
    setShowAddDialog(true);
    setEditMode(false); // 編集モードを解除
  }, []);

  // 日付選択
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    if (isMobile) {
      setShowBottomSheet(true);
    }
  }, [isMobile]);

  // 拠点管理
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

  // スタッフ管理
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

  // 検索結果から予約を選択
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

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl text-gray-900">予約管理</h1>
            
            {/* デスクトップ用検索バー */}
            {!isMobile && currentView === 'calendar' && (
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="予約を検索..."
                className="flex-1 max-w-md"
              />
            )}

            {/* リフレッシュボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={isMobile ? '' : 'ml-auto'}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            {/* モバイル用検索アイコン */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearchDialog(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* デスクトップ用ナビゲーション */}
            {!isMobile && (
              <div className="flex gap-2">
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  カレンダー
                </Button>
                <Button
                  variant={currentView === 'statistics' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('statistics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  統計
                </Button>
                <Button
                  variant={currentView === 'settings' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  設定
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={isMobile ? 'pb-4' : 'pb-4'}>
        {/* モバイル版は常にカレンダー表示 */}
        {(isMobile || currentView === 'calendar') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* カレンダー */}
            <CalendarView
              currentDate={currentDate}
              selectedDate={selectedDate}
              reservations={searchQuery ? filteredReservations : reservations}
              onDateSelect={handleDateSelect}
              onMonthChange={setCurrentDate}
            />

            {/* デスクトップ用予約リスト */}
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

        {/* デスクトップ版のみ統計・設定・印刷を表示 */}
        {!isMobile && currentView === 'statistics' && (
          <StatisticsView reservations={reservations} />
        )}

        {!isMobile && currentView === 'settings' && (
          <SettingsView
            locations={locations}
            staffList={staffList}
            onAddLocation={handleAddLocation}
            onDeleteLocation={handleDeleteLocation}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}


      </main>

      {/* モバイル用ボトムシート */}
      {isMobile && (
        <BottomSheet isOpen={showBottomSheet} onClose={() => setShowBottomSheet(false)}>
          <div>
            {/* 編集モードトグルボタン */}
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
                            // 編集モード：直接編集ダイアログを開く
                            handleEditReservation(reservation);
                            setShowBottomSheet(false);
                          } else {
                            // 通常モード：詳細ダイアログを開く
                            handleReservationClick(reservation);
                            setShowBottomSheet(false);
                          }
                        }}
                        className={`
                          relative bg-white rounded-2xl cursor-pointer transition-all active:scale-[0.98] overflow-hidden
                          ${editMode ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg' : 'border border-gray-200 hover:shadow-lg hover:border-gray-300'}
                        `}
                      >
                        <div className="p-4">
                          {/* 時間帯のモダン表示 */}
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                                {reservation.time}
                              </span>
                              <span className="text-sm text-gray-400 font-medium ml-1">
                                {reservation.duration}分
                              </span>
                            </div>
                            
                            {/* 決済ステータスバッジ */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePaymentStatusToggle(reservation.id);
                              }}
                              className="ml-auto flex-shrink-0"
                            >
                              {reservation.paymentStatus === 'paid' ? (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  支払済
                                </div>
                              ) : (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                  未決済
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 予約情報 */}
                          <div className="space-y-3">
                            {/* 名前 */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                                  {reservation.parentName}
                                </h3>
                                {reservation.childName && (
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    お子様: {reservation.childName}
                                    {reservation.childAge > 0 && ` (${reservation.childAge}ヶ月)`}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* メタ情報 */}
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Users className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {reservation.moldCount}本
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {reservation.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {reservation.staff}
                                </span>
                              </div>
                            </div>

                            {/* 備考がある場合 */}
                            {reservation.notes && (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                <p className="text-xs text-amber-900 line-clamp-2">
                                  💬 {reservation.notes}
                                </p>
                              </div>
                            )}

                            {/* 編集モード表示 */}
                            {editMode && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-center">
                                <Edit className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                                <span className="text-xs text-blue-700 font-semibold">
                                  タップして編集
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {reservations.filter((r) => r.date === formatDateToLocalString(selectedDate)).length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">この日の予約はありません</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* モバイル用FABボタン */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 z-30 rounded-full w-14 h-14 shadow-lg"
          onClick={() => {
            setEditingReservation(null); // 新規作成なのでリセット
            setShowAddDialog(true);
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* デスクトップ用追加ボタン */}
      {!isMobile && currentView === 'calendar' && (
        <Button
          size="lg"
          className="fixed bottom-8 right-8 z-30 rounded-full shadow-lg"
          onClick={() => {
            setEditingReservation(null); // 新規作成なのでリセット
            setShowAddDialog(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          新規予約
        </Button>
      )}

      {/* モバイル検索ダイアログ */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>予約検索</DialogTitle>
            <DialogDescription>予約を検索して詳細を確認できます</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="予約を検索..."
            />
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {filteredReservations.length === 0 ? (
                <p className="text-center py-8 text-gray-400">
                  {searchQuery ? '検索結果がありません' : '検索キーワードを入力してください'}
                </p>
              ) : (
                filteredReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    onClick={() => handleSearchResultClick(reservation)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-gray-900">
                      {reservation.parentName}
                      {reservation.childName && ` / ${reservation.childName}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reservation.date} {reservation.time}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      <ReservationDialog
        reservation={selectedReservation}
        open={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedReservation(null);
        }}
        onEdit={handleEditReservation}
        onDelete={handleDeleteReservation}
        onPaymentStatusToggle={handlePaymentStatusToggle}
      />
    </div>
  );
}
