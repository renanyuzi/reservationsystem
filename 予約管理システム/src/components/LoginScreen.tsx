import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Loader2, Lock, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { name: string; staffId: string; role: string }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 初期データセットアップ確認
    const initialize = async () => {
      try {
        await api.init();
      } catch (err) {
        console.error('初期化エラー:', err);
        setError('初期化に失敗しました。再読み込みしてください。');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(staffId, password);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">初期データをセットアップ中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">予約管理システム</h1>
          <p className="text-gray-600">スタッフIDとパスワードでログインしてください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              スタッフID
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="スタッフIDを入力"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="パスワードを入力"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                認証中...
              </>
            ) : (
              'ログイン'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
