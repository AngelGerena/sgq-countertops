import { useState, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthProvider';

export default function Login() {
  const { session, admin, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (!loading && session && admin) return <Navigate to="/admin" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) { setErr(error); return; }
    nav('/admin', { replace: true });
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">Finesse OS</div>
        <div className="login-sub">Santiago's Granite &amp; Quartz</div>
        <form onSubmit={submit}>
          {err && <div className="err">{err}</div>}
          <label htmlFor="li-email">Email</label>
          <input id="li-email" type="email" autoComplete="username"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <label htmlFor="li-pass">Password</label>
          <input id="li-pass" type="password" autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn gold block" type="submit" disabled={busy}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
