import { useState } from 'react';
import { useStore } from '../hooks/useStore';

export function AuthPage() {
  const { login, register, loading } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div className="glass-card slide-up" style={{
        width: '100%', maxWidth: 400, padding: 32,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            Checkydoo
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {isRegister ? 'Создайте аккаунт' : 'Войдите в аккаунт'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isRegister && (
            <input
              className="glass-input"
              type="text"
              placeholder="Ваше имя"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
          )}
          <input
            className="glass-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="glass-input"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {localError && (
            <div style={{ color: 'var(--accent-red)', fontSize: 13, textAlign: 'center' }}>
              {localError}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', fontSize: 15, marginTop: 4,
          }}>
            {loading ? '...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setLocalError(''); }}
          style={{
            display: 'block', width: '100%', marginTop: 16, textAlign: 'center',
            background: 'none', border: 'none', color: 'var(--accent-green)',
            cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
          }}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}
