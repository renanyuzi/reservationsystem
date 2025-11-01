import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { User } from '../types/reservation';
import { LogIn, UserCircle, Shield, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { QuickSetup } from './QuickSetup';
import { ResetSetup } from './ResetSetup';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState('');

  // デバッグ: コンポーネントがマウントされたことをログ
  useEffect(() => {
    console.log('=== LoginScreen マウント ===');
    // コンポーネントがマウントされた時にエラーとフォームをクリア
    setError('');
    setUsername('');
    setPassword('');
    
    return () => {
      console.log('=== LoginScreen アンマウント ===');
    };
  }, []);

  // 管理職アカウントの存在確認（初回のみ）
  useEffect(() => {
    const checkManagerAccount = async () => {
      try {
        console.log('👔 管理職アカウントの確認中...');
        
        // セットアップ済みフラグをチェック
        const setupCompleted = localStorage.getItem('setupCompleted');
        if (setupCompleted === 'true') {
          console.log('✅ セットアップ済み（ローカルストレージ）');
          setIsInitializing(false);
          return;
        }

        // まずヘルスチェック
        const healthRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/health`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        
        if (!healthRes.ok) {
          throw new Error('サーバーに接続できません');
        }

        // ユーザー一覧を取得
        const usersRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/users`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        
        if (usersRes.ok) {
          const users = await usersRes.json();
          const hasManager = users.some((u: any) => u.username === 'manager');
          
          if (!hasManager) {
            console.log('⚠️ 管理職アカウントが存在しません。セットアップが必要です。');
            setNeedsSetup(true);
          } else {
            console.log('✅ 管理職アカウントが存在します');
            // セットアップ完了フラグを保存
            localStorage.setItem('setupCompleted', 'true');
          }
        } else {
          // ユーザー取得に失敗 = 空のDBかもしれない
          setNeedsSetup(true);
        }
      } catch (err) {
        console.error('❌ ���認エラー:', err);
        setError('サーバーへの接続に失敗しました。');
      } finally {
        setIsInitializing(false);
      }
    };

    checkManagerAccount();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('=== ログイン試行 ===');
      console.log('ユーザー名:', username);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();
      console.log('ログイン応答:', response.status, data);

      if (!response.ok) {
        console.error('ログイン失敗:', data);
        throw new Error(data.error || 'ログインに失敗しました');
      }

      console.log('✅ ログイン成功:', data.name);
      
      // ログイン成功したらフォームをクリア
      setUsername('');
      setPassword('');
      setError('');
      
      // ログイン情報をコールバックで渡す
      onLogin(data);
      
      // ログイン情報がlocalStorageに保存された後、少し待ってからリフレッシュ
      console.log('🔄 ページをリフレッシュします...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error('❌ ログインエラー:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-lg font-medium text-gray-900">システムを初期化中</p>
                <p className="text-sm text-gray-500 mt-2">
                  初回起動時はデータベースのセットアップに<br />
                  数秒かかる場合があります...
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Supabase Edge Functionに接続中</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // セットアップ完了後の処理
  const handleSetupComplete = () => {
    setNeedsSetup(false);
    setIsInitializing(false);
    // セットアップ完了フラグを保存
    localStorage.setItem('setupCompleted', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* パスワード変更のお知らせ */}
      {!needsSetup && error.includes('Invalid credentials') && (
        <div className="w-full max-w-md mb-4">
          <ResetSetup />
        </div>
      )}

      {needsSetup && (
        <div className="w-full max-w-md">
          <QuickSetup onComplete={handleSetupComplete} />
        </div>
      )}

      {!needsSetup && (
        <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">ベビー型取り予約管理</CardTitle>
          <CardDescription>スタッフIDとパスワードでログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">スタッフID</Label>
              <Input
                id="username"
                type="text"
                placeholder="例: staff001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isInitializing}>
              {isLoading ? (
                '認証中...'
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  ログイン
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                <Shield className="w-3 h-3 inline mr-1" />
                セキュアな接続で保護されています
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
