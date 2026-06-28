import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(32),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  organization: z.string().optional(),
}).refine((d: { password: string; confirm_password: string }) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type SignUpForm = z.infer<typeof signupSchema>;

export function SignUp() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    setError(null);
    try {
      await authRegister({
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
        organization: data.organization,
      });
      navigate('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-[13px] text-white/30 font-mono tracking-[0.08em] mt-2 uppercase">
            Create Account
          </p>
        </div>

        <div className="relative rounded-[28px] p-8 backdrop-blur-[35px]"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <div className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          />

          <div className="relative z-10">
            <h2 className="text-xl font-light text-white/90 tracking-[-0.01em]">Create account</h2>
            <p className="text-sm text-white/30 mt-1 font-[350]">Register for intelligence access</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {error && (
                <div className="text-xs text-red-400/90 bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                  {error}
                </div>
              )}

              {[
                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'John Doe' },
                { label: 'Username', key: 'username', type: 'text', placeholder: 'jdoe' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'you@domain.com' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    autoComplete="off"
                    className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                      placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                      transition-all duration-200"
                    placeholder={f.placeholder}
                    {...register(f.key as keyof SignUpForm)}
                  />
                  {errors[f.key as keyof SignUpForm] && (
                    <p className="text-[11px] text-red-400/80 mt-1.5">
                      {errors[f.key as keyof SignUpForm]?.message}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                      placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                      transition-all duration-200 pr-10"
                    placeholder="Min. 8 characters"
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors text-xs">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-400/80 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
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

              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-[0.08em] mb-2">
                  Organization <span className="text-white/20">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-4 text-sm text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-xl
                    placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06]
                    transition-all duration-200"
                  placeholder="e.g. Cyber Command"
                  {...register('organization')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-white/10 border border-white/[0.12] text-sm text-white/80 font-medium
                  hover:bg-white/[0.15] hover:text-white transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-xs text-white/30">Already have an account? </span>
              <Link to="/login" className="text-xs text-white/50 hover:text-white/80 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
