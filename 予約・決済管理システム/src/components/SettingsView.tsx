import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, Plus, Save, User as UserIcon } from 'lucide-react';
import { Location, Staff, User } from '../types/reservation';
import * as api from '../utils/api';

interface SettingsViewProps {
  locations: Location[];
  staffList: Staff[];
  currentUser: User;
  onAddLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onAddStaff: (name: string) => void;
  onDeleteStaff: (id: string) => void;
  onUserUpdate?: () => void;
}

export function SettingsView({
  locations,
  staffList,
  currentUser,
  onAddLocation,
  onDeleteLocation,
  onAddStaff,
  onDeleteStaff,
  onUserUpdate,
}: SettingsViewProps) {
  const [newLocation, setNewLocation] = useState('');
  const [newStaff, setNewStaff] = useState('');
  
  // プロフィール編集用の状態
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    username: currentUser.username,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      onAddLocation(newLocation.trim());
      setNewLocation('');
    }
  };

  const handleAddStaff = () => {
    if (newStaff.trim()) {
      onAddStaff(newStaff.trim());
      setNewStaff('');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    // パスワード変更時のバリデーション
    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 8) {
        setProfileMessage({ type: 'error', text: '新しいパスワードは8文字以上で入力してください' });
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileMessage({ type: 'error', text: 'パスワードが一致しません' });
        return;
      }
      if (!profileForm.currentPassword) {
        setProfileMessage({ type: 'error', text: '現在のパスワードを入力してください' });
        return;
      }
    }

    setIsSaving(true);

    try {
      const updateData: any = {
        name: profileForm.name,
      };

      // パスワード変更がある場合
      if (profileForm.newPassword) {
        updateData.currentPassword = profileForm.currentPassword;
        updateData.newPassword = profileForm.newPassword;
      }

      await api.updateUser(currentUser.id, updateData);
      
      setProfileMessage({ type: 'success', text: 'プロフィールを更新しました' });
      setProfileForm({
        ...profileForm,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // 親コンポーネントに通知
      if (onUserUpdate) {
        onUserUpdate();
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setProfileMessage({ type: 'error', text: 'プロフィールの更新に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl text-gray-900">設定</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* プロフィール編集 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <CardTitle>マイプロフィール</CardTitle>
            </div>
            <CardDescription>
              自分の名前とパスワードを変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-name">氏名 *</Label>
                  <Input
                    id="profile-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="山田太郎"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="profile-username">スタッフID</Label>
                  <Input
                    id="profile-username"
                    value={profileForm.username}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">スタッフIDは変更できません</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">パスワード変更（任意）</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current-password">現在のパスワード</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      placeholder="現在のパスワード"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-password">新しいパスワード</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      placeholder="新しいパスワード"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">パスワード確認</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      placeholder="パスワード再入力"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ※ パスワードを変更しない場合は空欄のままにしてください
                </p>
              </div>

              {profileMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <Button type="submit" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '保存中...' : '変更を保存'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 拠点管理（管理職のみ） */}
        {currentUser.role === 'manager' && (
          <Card>
            <CardHeader>
              <CardTitle>拠点管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="newLocation">新しい拠点</Label>
                  <Input
                    id="newLocation"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="拠点名を入力"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                  />
                </div>
                <Button onClick={handleAddLocation} className="mt-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  追加
                </Button>
              </div>

              <div className="space-y-2">
                {locations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">拠点がありません</p>
                ) : (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-900">{location.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`「${location.name}」を削除しますか？`)) {
                            onDeleteLocation(location.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* スタッフ管理（管理職のみ） */}
        {currentUser.role === 'manager' && (
          <Card>
            <CardHeader>
              <CardTitle>スタッフ管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="newStaff">新しいスタッフ</Label>
                  <Input
                    id="newStaff"
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    placeholder="スタッフ名を入力"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStaff()}
                  />
                </div>
                <Button onClick={handleAddStaff} className="mt-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  追加
                </Button>
              </div>

              <div className="space-y-2">
                {staffList.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">スタッフがいません</p>
                ) : (
                  staffList.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-900">{staff.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`「${staff.name}」を削除しますか？`)) {
                            onDeleteStaff(staff.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
