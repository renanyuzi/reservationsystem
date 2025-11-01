import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { User } from '../types/reservation';
import { UserPlus, Edit, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import * as api from '../utils/api';

export function StaffManagement() {
  console.log('StaffManagement レンダリング');
  
  const [users, setUsers] = useState<User[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff' as 'staff' | 'manager',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('スタッフの読み込みに失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      
      await loadUsers();
      setShowAddDialog(false);
      setEditingUser(null);
      resetForm();
    } catch (error: any) {
      console.error('スタッフの保存に失敗:', error);
      alert(error.message || 'スタッフの保存に失敗しました');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('このスタッフを削除してもよろしいですか？')) return;

    try {
      await api.deleteUser(userId);
      await loadUsers();
    } catch (error: any) {
      console.error('スタッフの削除に失敗:', error);
      alert(error.message || 'スタッフの削除に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'staff',
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
    });
    setShowAddDialog(true);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    resetForm();
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">スタッフ管理</h1>
          <p className="text-sm text-gray-500 mt-1">スタッフの追加・編集・削除を行います</p>
        </div>
        <Button onClick={openAddDialog}>
          <UserPlus className="w-4 h-4 mr-2" />
          スタッフ追加
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    user.role === 'manager' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {user.role === 'manager' ? (
                      <Shield className="w-6 h-6 text-purple-600" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.name}</CardTitle>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">権限:</span>
                  <Badge variant={user.role === 'manager' ? 'default' : 'secondary'}>
                    {user.role === 'manager' ? '管理職' : 'スタッフ'}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'スタッフ編集' : 'スタッフ追加'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'スタッフ情報を編集します' : '新しいスタッフを追加します'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">氏名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 山田太郎"
                required
              />
            </div>

            <div>
              <Label htmlFor="username">スタッフID *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="例: staff001"
                required
                disabled={!!editingUser}
              />
            </div>

            <div>
              <Label htmlFor="password">
                パスワード {editingUser && '(変更する場合のみ入力)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="パスワード"
                required={!editingUser}
              />
            </div>

            <div>
              <Label htmlFor="role">権限 *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'staff' | 'manager') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">スタッフ</SelectItem>
                  <SelectItem value="manager">管理職</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
              💡 インセンティブは1件あたり ¥1,000 の固定報酬です
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingUser ? '更新' : '追加'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
