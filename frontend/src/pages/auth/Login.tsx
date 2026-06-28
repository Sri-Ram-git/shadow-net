import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Spotlight gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-white/[0.04] to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-[2rem] font-light tracking-[-0.02em] text-white">
            shadow<span className="font-normal text-white/50">net</span>
          </h1>
          <p className="text-[13px] text-white/30 font-mono tracking-[0.08em] mt-2 uppercase">
            Intelligence Dashboard
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div
          className="relative rounded-[28px] p-8 backdrop-blur-[35px]"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-xl font-light text-white/90 tracking-[-0.01em]">Sign in</h2>
            <p className="text-sm text-white/30 mt-1 font-[350]">Access your intelligence console</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {error && (
                <div className="text-xs text-red-400/90 bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                    placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                    transition-all duration-200"
                  placeholder="you@domain.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-400/80 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                      placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                      transition-all duration-200 pr-10"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-400/80 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded bg-white/[0.04] border border-white/[0.12]
                    checked:bg-white/20 checked:border-white/40 accent-white/30" />
                  <span className="text-xs text-white/35">Remember</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-white/35 hover:text-white/60 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-white/10 border border-white/[0.12] text-sm text-white/80 font-medium
                  hover:bg-white/[0.15] hover:text-white transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-xs text-white/30">No account? </span>
              <Link to="/signup" className="text-xs text-white/50 hover:text-white/80 transition-colors">
                Create one
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 font-mono tracking-[0.04em] mt-8">
          &copy; {new Date().getFullYear()} SHADOWNET &mdash; Classified
        </p>
      </motion.div>
    </div>
  );
}
