import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return '密碼必須至少8個字符';
    }
    if (!/[a-z]/.test(pwd)) {
      return '密碼必須包含至少一個小寫字母';
    }
    if (!/[A-Z]/.test(pwd)) {
      return '密碼必須包含至少一個大寫字母';
    }
    if (!/\d/.test(pwd)) {
      return '密碼必須包含至少一個數字';
    }
    if (!/[@$!%*?&]/.test(pwd)) {
      return '密碼必須包含至少一個特殊字符 (@$!%*?&)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (username.length < 3 || username.length > 20) {
      setError('用戶名必須在3到20個字符之間');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('用戶名只能包含字母、數字和下劃線');
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('密碼不匹配');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with:', { email, username, password: '***' });
      await register({ email, username, password });
      console.log('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error details:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = '註冊失敗，請重試';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        const details = err.response.data.details;
        if (Array.isArray(details) && details.length > 0) {
          errorMessage = details.map((d: any) => d.msg).join(', ');
        }
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>建立帳戶</CardTitle>
        <CardDescription>
          輸入您的資訊以建立您的帳戶
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">用戶名</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">密碼必須包含：</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>至少8個字符</li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>一個小寫字母 (a-z)</li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>一個大寫字母 (A-Z)</li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>一個數字 (0-9)</li>
                <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : ''}>一個特殊字符 (@$!%*?&)</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">確認密碼</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '建立帳戶中...' : '註冊'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          已有帳戶？
          <Link to="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
            登入
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

