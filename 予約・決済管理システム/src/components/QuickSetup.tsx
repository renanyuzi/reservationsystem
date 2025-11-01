import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QuickSetupProps {
  onComplete: () => void;
}

export function QuickSetup({ onComplete }: QuickSetupProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runSetup = async () => {
    setStatus('loading');
    setMessage('管理職アカウントを作成中...');

    try {
      // セットアップ実行
      const setupRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/setup-manager`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const setupData = await setupRes.json();

      if (!setupRes.ok) {
        throw new Error(setupData.error || 'セットアップに失敗しました');
      }

      setMessage('データベース書き込み中...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 検証
      setMessage('アカウントを確認中...');
      const loginRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'manager', password: 'Manager@2024!Secure' }),
        }
      );

      if (!loginRes.ok) {
        throw new Error('アカウント作成は完了しましたが、ログインテストに失敗しました');
      }

      setStatus('success');
      setMessage('セットアップ完了！');
      
      // セットアップ完了フラグを保存
      localStorage.setItem('setupCompleted', 'true');
      
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  if (status === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-green-900 font-medium">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <p className="text-red-900 font-medium">{message}</p>
            <Button onClick={runSetup} variant="outline">
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-900 font-medium">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              初期セットアップが必要です
            </p>
            <p className="text-sm text-gray-600">
              管理職アカウントを作成します（約5秒）
            </p>
          </div>
          <Button onClick={runSetup} className="w-full">
            セットアップを開始
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
