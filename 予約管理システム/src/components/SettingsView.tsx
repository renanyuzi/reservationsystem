import { useState, useEffect } from 'react';
import { User as UserIcon, Lock, MapPin, Users, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { api } from '../utils/api';

interface User {
  name: string;
  staffId: string;
  role: 'admin' | 'staff';
}

interface SettingsViewProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
}

export function SettingsView({ currentUser, onUserUpdate }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'locations' | 'staff'>('profile');

  // プロフィール
  const [name, setName] = useState(currentUser.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // 拠点
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);

  // スタッフマスター
  const [staffList, setStaffList] = useState<string[]>([]);
  const [newStaff, setNewStaff] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    loadLocations();
    loadStaff();
  }, []);

  const loadLocations = async () => {
    try {
      const result = await api.getLocations();
      setLocations(result.locations);
    } catch (err) {
      console.error('拠点取得エラー:', err);
    }
  };

  const loadStaff = async () => {
    try {
      const result = await api.getStaff();
      setStaffList(result.staff);
    } catch (err) {
      console.error('スタッフ取得エラー:', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('新しいパスワードが一致しません');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setProfileError('パスワードは8文字以上で入力してください');
      return;
    }

    if (newPassword && !currentPassword) {
      setProfileError('現在のパスワードを入力してください');
      return;
    }

    setProfileLoading(true);

    try {
      await api.updateProfile({
        staffId: currentUser.staffId,
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      onUserUpdate({ ...currentUser, name });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('プロフィールを更新しました');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;

    setLocationsLoading(true);
    try {
      const result = await api.addLocation(newLocation);
      setLocations(result.locations);
      setNewLocation('');
    } catch (err) {
      console.error('拠点追加エラー:', err);
      alert(err instanceof Error ? err.message : '拠点の追加に失敗しました');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleDeleteLocation = async (location: string) => {
    if (!confirm(`拠点「${location}」を削除してもよろしいですか？`)) {
      return;
    }

    setLocationsLoading(true);
    try {
      const result = await api.deleteLocation(location);
      setLocations(result.locations);
    } catch (err) {
      console.error('拠点削除エラー:', err);
      alert('拠点の削除に失敗しました');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.trim()) return;

    setStaffLoading(true);
    try {
      const result = await api.addStaff(newStaff);
      setStaffList(result.staff);
      setNewStaff('');
    } catch (err) {
      console.error('スタッフ追加エラー:', err);
      alert(err instanceof Error ? err.message : 'スタッフの追加に失敗しました');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (staff: string) => {
    if (!confirm(`スタッフ「${staff}」を削除してもよろしいですか？`)) {
      return;
    }

    setStaffLoading(true);
    try {
      const result = await api.deleteStaff(staff);
      setStaffList(result.staff);
    } catch (err) {
      console.error('スタッフ削除エラー:', err);
      alert('スタッフの削除に失敗しました');
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* タブヘッダー */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span>プロフィール</span>
              </button>
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('locations')}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                      activeTab === 'locations'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>拠点管理</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                      activeTab === 'staff'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>スタッフ管理</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <h2 className="text-gray-900">プロフィール設定</h2>

                <div>
                  <label className="block text-gray-700 mb-2">氏名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">スタッフID</label>
                  <input
                    type="text"
                    value={currentUser.staffId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    パスワード変更
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">現在のパスワード</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="変更する場合のみ入力"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">新しいパスワード</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="8文字以上"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">新しいパスワード（確認）</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="もう一度入力"
                      />
                    </div>
                  </div>
                </div>

                {profileError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {profileError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      更新
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'locations' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                <h2 className="text-gray-900">拠点管理</h2>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="新しい拠点名を入力"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  />
                  <button
                    onClick={handleAddLocation}
                    disabled={locationsLoading || !newLocation.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    追加
                  </button>
                </div>

                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-gray-900">{location}</span>
                      <button
                        onClick={() => handleDeleteLocation(location)}
                        disabled={locationsLoading}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        削除
                      </button>
                    </div>
                  ))}
                </div>

                {locations.length === 0 && (
                  <p className="text-gray-500 text-center py-8">拠点が登録されていません</p>
                )}
              </div>
            )}

            {activeTab === 'staff' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                <h2 className="text-gray-900">担当スタッフ管理</h2>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    placeholder="新しいスタッフ名を入力"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStaff())}
                  />
                  <button
                    onClick={handleAddStaff}
                    disabled={staffLoading || !newStaff.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    追加
                  </button>
                </div>

                <div className="space-y-2">
                  {staffList.map((staff) => (
                    <div
                      key={staff}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-gray-900">{staff}</span>
                      <button
                        onClick={() => handleDeleteStaff(staff)}
                        disabled={staffLoading}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        削除
                      </button>
                    </div>
                  ))}
                </div>

                {staffList.length === 0 && (
                  <p className="text-gray-500 text-center py-8">スタッフが登録されていません</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
