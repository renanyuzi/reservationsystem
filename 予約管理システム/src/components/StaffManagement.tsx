import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, Shield, User } from 'lucide-react';
import { api } from '../utils/api';

interface User {
  name: string;
  staffId: string;
  role: 'admin' | 'staff';
}

export function StaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await api.getUsers();
      setUsers(result.users);
    } catch (err) {
      console.error('ユーザー一覧取得エラー:', err);
      alert('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowDialog(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.name} さんを削除してもよろしいですか？`)) {
      return;
    }

    try {
      await api.deleteUser(user.staffId);
      await loadUsers();
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      alert('ユーザーの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-gray-900">スタッフ管理</h1>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              スタッフ追加
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.staffId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                    <h3 className="text-gray-900">{user.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded ${
                      user.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role === 'admin' ? '管理者' : 'スタッフ'}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">
                  <span className="text-gray-500">ID:</span> {user.staffId}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-gray-500 text-center py-12">スタッフが登録されていません</p>
          )}
        </div>
      </div>

      {showDialog && (
        <UserDialog
          user={editingUser}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

interface UserDialogProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

function UserDialog({ user, onClose, onSuccess }: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    staffId: user?.staffId || '',
    password: '',
    role: user?.role || 'staff' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user && !formData.password) {
      setError('パスワードを入力してください');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      if (user) {
        await api.updateUser(user.staffId, {
          name: formData.name,
          staffId: formData.staffId,
          password: formData.password || undefined,
          role: formData.role,
        });
      } else {
        await api.createUser(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-gray-900">
            {user ? 'スタッフ編集' : 'スタッフ追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">氏名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">スタッフID *</label>
            <input
              type="text"
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              パスワード {user ? '(変更する場合のみ)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={user ? '変更しない場合は空欄' : '8文字以上'}
              required={!user}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">権限 *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="staff">スタッフ</option>
              <option value="admin">管理者</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                user ? '更新' : '追加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
