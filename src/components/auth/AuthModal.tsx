import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => {
    setFullName(''); setEmail(''); setPassword('');
    setError(''); setSuccess(''); setLoading(false);
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError(''); setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (mode === 'register') {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        reset();
        onClose();
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email first — check your inbox.');
        } else if (error.toLowerCase().includes('invalid')) {
          setError('Wrong email or password.');
        } else {
          setError(error);
        }
      } else {
        reset();
        onClose();
      }
    }
    setLoading(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => { reset(); onClose(); }}
          />

          {/* Scrollable container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm my-auto"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="rounded-2xl relative"
                style={{
                  background: 'linear-gradient(135deg, #1a2332 0%, #0d1b2a 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                }}
              >
                {/* Close */}
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg z-10"
                  style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
                >
                  <X size={15} />
                </button>

                <div className="p-6">
                  {/* Logo */}
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #0095FF, rgba(0,149,255,1))',
                        border: '1px solid #0095FF',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#0095FF', fontFamily: 'Syne, sans-serif' }}>CM</span>
                    </div>
                    <span className="font-extrabold text-sm" style={{ color: 'rgba(255,255,255,0.95)', fontFamily: 'Syne, sans-serif' }}>
                      CareerMind <span style={{ color: '#0095FF' }}>AI</span>
                    </span>
                  </div>

                  {/* Tab switcher */}
                  <div
                    className="flex rounded-xl p-1 mb-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {(['login', 'register'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => switchMode(m)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: mode === m ? '#0095FF' : 'transparent',
                          border: mode === m ? '1px solid #0095FF' : '1px solid transparent',
                          color: mode === m ? '#0095FF' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {m === 'login' ? 'Log In' : 'Register'}
                      </button>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-2.5">
                    <AnimatePresence>
                      {mode === 'register' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                              type="text"
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              placeholder="Full name"
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                              style={inputStyle}
                              onFocus={e => (e.target.style.borderColor = '#0095FF')}
                              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#0095FF')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#0095FF')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Error / Success */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
                        >
                          <AlertCircle size={12} className="shrink-0" />
                          {error}
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
                        >
                          ✓ {success}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #0095FF, #0095FF)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 16px #0095FF',
                      }}
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'login' ? 'Log In' : 'Create Account'}
                    </motion.button>
                  </form>

                  <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {mode === 'login' ? "No account? " : 'Have an account? '}
                    <button
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="underline"
                      style={{ color: '#0095FF' }}
                    >
                      {mode === 'login' ? 'Register' : 'Log in'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}




