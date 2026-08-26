import React, { useState, FormEvent } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível entrar. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-ink tracking-tight">Acesse sua conta</h2>
        <p className="text-ink-muted mt-2 text-sm font-medium">
          Insira suas credenciais para entrar no sistema SigRest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-ink-muted">E-mail</label>
          <input
            type="email"
            data-testid="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="admin@sigrest.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-ink-muted">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              data-testid="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          data-testid="login-submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Entrando...'
          ) : (
            <>
              <LogIn size={20} /> Entrar no Sistema
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-xs text-ink-muted">Desenvolvido por George Manganelli (2026)</p>
      </div>
    </div>
  );
}
