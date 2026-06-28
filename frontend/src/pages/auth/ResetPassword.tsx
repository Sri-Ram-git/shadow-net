import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d: { password: string; confirm_password: string }) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type Form = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Reset failed');
      }
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white/50 text-sm">Invalid or missing reset token.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-white/[0.04] to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-[2rem] font-light tracking-[-0.02em] text-white">
            shadow<span className="font-normal text-white/50">net</span>
          </h1>
        </div>

        <div className="relative rounded-[28px] p-8 backdrop-blur-[35px]"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <div className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          />

          <div className="relative z-10">
            {done ? (
              <>
                <h2 className="text-xl font-light text-white/90 tracking-[-0.01em]">Password reset</h2>
                <p className="text-sm text-white/30 mt-2 font-[350]">
                  Your password has been reset successfully. Redirecting to sign in...
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-light text-white/90 tracking-[-0.01em]">Set new password</h2>
                <p className="text-sm text-white/30 mt-1 font-[350]">Enter your new password below.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  {error && (
                    <div className="text-xs text-red-400/90 bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                        placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                        transition-all duration-200"
                      placeholder="Min. 8 characters"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-[11px] text-red-400/80 mt-1.5">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                        placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                        transition-all duration-200"
                      placeholder="Repeat password"
                      {...register('confirm_password')}
                    />
                    {errors.confirm_password && (
                      <p className="text-[11px] text-red-400/80 mt-1.5">{errors.confirm_password.message}</p>
                    )}
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
                      'Reset password'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-xs text-white/35 hover:text-white/60 transition-colors">
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
