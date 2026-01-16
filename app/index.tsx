import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '~/components/auth/LoginForm';
import { RegisterForm } from '~/components/auth/RegisterForm';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index(): React.JSX.Element {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleSuccess = (): void => {
    navigate({ to: '/main' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Patentify</h1>
          <p className="text-muted-foreground">Gestione brevetti semplificata</p>
        </div>

        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={isLogin ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setIsLogin(true)}
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setIsLogin(false)}
          >
            Crea Account
          </Button>
        </div>

        {isLogin ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}
