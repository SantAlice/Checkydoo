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
      padding: 20, background: 'var(--surface)',
    }}>
      <div className="slide-up" style={{
        width: '100%', maxWidth: 400, padding: 36,
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-full)',
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Checkydoo</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginTop: 6 }}>
            {isRegister ? 'Создайте аккаунт' : 'Войдите в аккаунт'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isRegister && (
            <input className="input" type="text" placeholder="Ваше имя"
              value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          )}
          <input className="input" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Пароль"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />

          {localError && (
            <div style={{ color: 'var(--error)', fontSize: 13, textAlign: 'center' }}>
              {localError}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{
            width: '100%', padding: '16px', fontSize: 16, marginTop: 4,
          }}>
            {loading ? '...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setLocalError(''); }}
          style={{
            display: 'block', width: '100%', marginTop: 20, textAlign: 'center',
            background: 'none', border: 'none', color: 'var(--primary)',
            cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 600,
          }}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}
