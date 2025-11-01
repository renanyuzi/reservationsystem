import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { User } from '../types/reservation';
import { LogIn, UserCircle, Shield, AlertCircle } from 'lucide-react';
import * as api from '../utils/api';

interface LoginScreenProps {
  onLogin: (user: User, token: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
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

  // 初期セットアップの確認
  useEffect(() => {
    const checkSetup = async () => {
      try {
        console.log('👔 システムのセットアップを確認中...');
        
        // セットアップAPIを呼び出し（既にセットアップ済みの場合はskipped=trueが返る）
        await api.setupInitialData();
        console.log('✅ セットアップ確認完了');
      } catch (err) {
        console.error('❌ セットアップ確認エラー:', err);
        // セットアップエラーは無視（既にセットアップ済みの可能性）
      } finally {
        setIsInitializing(false);
      }
    };

    checkSetup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('=== ログイン試行 ===');
      console.log('ユーザー名:', username);
      
      const { user, token } = await api.login(username, password);
      console.log('✅ ログイン成功:', user.name);
      
      // ログイン成功したらフォームをクリア
      setUsername('');
      setPassword('');
      setError('');
      
      // ログイン情報をコールバックで渡す
      onLogin(user, token);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* 初回ログイン時のお知らせ */}
      {!error && (
        <div className="w-full max-w-md mb-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">初回ログイン</p>
                <p className="text-xs mt-1">
                  デフォルトのログイン情報:<br />
                  <span className="font-mono">ユーザー名: manager</span><br />
                  <span className="font-mono">パスワード: ChangeMe123!</span><br />
                  <span className="text-blue-600">※ログイン後、必ずパスワードを変更してください</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                placeholder="例: manager"
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
    </div>
  );
}
