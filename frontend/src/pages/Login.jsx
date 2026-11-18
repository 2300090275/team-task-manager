import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AlertCircle, Zap, Loader2, ArrowRight, Shield, BarChart3, Users, CheckCircle2, Lock, Mail } from 'lucide-react';

/* ═══ Floating particle ═══ */
function Particle({ delay, duration, x, y, size }) {
  return (
    <motion.div
      className="absolute rounded-full bg-blue-500/20"
      style={{ width: size, height: size }}
      initial={{ x, y, opacity: 0, scale: 0 }}
      animate={{
        x: [x, x + 30, x - 20, x],
        y: [y, y - 40, y - 80, y - 120],
        opacity: [0, 0.6, 0.4, 0],
        scale: [0, 1, 0.8, 0],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ═══ Feature card on left panel ═══ */
function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 backdrop-blur-sm hover:bg-white/[0.07] transition-colors duration-300"
    >
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0 border border-white/[0.08]">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/80">{title}</p>
        <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // ── Auth logic (UNCHANGED) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  // ── Mouse tracking for glow ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // Parallax transforms for left panel elements
  const parallaxX = useTransform(glowX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-15, 15]);
  const parallaxY = useTransform(glowY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [-10, 10]);

  const handleMouseMove = useCallback((e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  // ── Ripple effect ──
  const [ripple, setRipple] = useState(null);
  const handleRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="flex min-h-screen bg-slate-950 overflow-hidden relative"
    >
      {/* ═══ Cursor-tracking glow ═══ */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          x: glowX,
          y: glowY,
          width: 500,
          height: 500,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* ═══ Background grid + orbs ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-[120px]" />

        {/* Particles */}
        <Particle delay={0} duration={6} x={100} y={200} size={4} />
        <Particle delay={1.5} duration={7} x={300} y={400} size={3} />
        <Particle delay={3} duration={5} x={200} y={600} size={5} />
        <Particle delay={0.5} duration={8} x={500} y={300} size={3} />
        <Particle delay={2} duration={6} x={700} y={500} size={4} />
      </div>

      {/* ═══ LEFT PANEL — Branding + Features ═══ */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 z-10">
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="max-w-md relative"
        >
          {/* Logo + brand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                className="relative"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-xl -z-10" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">TaskFlow</h1>
                <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.15em]">Pro Suite</p>
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              Manage your team's
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-primary to-indigo-400 bg-clip-text text-transparent">
                productivity
              </span>
            </h2>
            <p className="text-white/30 text-sm leading-relaxed mb-8 max-w-sm">
              Streamline workflows, track progress in real-time, and empower your team to deliver results faster.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-3">
            <FeatureCard icon={BarChart3} title="Real-time Analytics" desc="Track team performance with interactive dashboards" delay={0.4} />
            <FeatureCard icon={Users} title="Team Collaboration" desc="Assign tasks, manage members, and work together" delay={0.5} />
            <FeatureCard icon={Shield} title="Enterprise Security" desc="Role-based access control and secure authentication" delay={0.6} />
          </div>

          {/* Trust indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3 mt-8"
          >
            <div className="flex -space-x-2">
              {['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((bg, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, type: 'spring' }}
                  className={`h-8 w-8 rounded-full ${bg} border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {['A', 'B', 'C', 'D'][i]}
                </motion.div>
              ))}
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Trusted by teams</p>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[11px] text-white/30 ml-1">5.0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative vertical divider */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2/3 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ═══ RIGHT PANEL — Login Form ═══ */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo (hidden on desktop) */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            className="flex justify-center mb-8 lg:hidden"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
            </div>
          </motion.div>

          {/* ── Glass Card ── */}
          <div className="relative group">
            {/* Card glow border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
              {/* Top gradient accent */}
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              <div className="p-8">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-white/30 text-sm mt-2">Sign in to your TaskFlow account</p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3.5 text-sm text-red-400"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider" htmlFor="login-email">
                      Email Address
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-primary/30' : ''}`}>
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-400' : 'text-white/20'}`} />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        required
                        autoFocus
                        className="h-12 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary/40 rounded-xl transition-all duration-200"
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider" htmlFor="login-password">
                      Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-primary/30' : ''}`}>
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-400' : 'text-white/20'}`} />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="h-12 pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary/40 rounded-xl transition-all duration-200"
                      />
                    </div>
                  </motion.div>

                  {/* Submit button with ripple */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      onClick={handleRipple}
                      className="relative w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none group"
                    >
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                      {/* Ripple effect */}
                      <AnimatePresence>
                        {ripple && (
                          <motion.div
                            key={ripple.id}
                            initial={{ scale: 0, opacity: 0.5 }}
                            animate={{ scale: 4, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute rounded-full bg-white/25"
                            style={{ left: ripple.x - 20, top: ripple.y - 20, width: 40, height: 40 }}
                          />
                        )}
                      </AnimatePresence>

                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in…
                          </>
                        ) : (
                          <>
                            Sign in
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </span>
                    </button>
                  </motion.div>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Sign up link */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-white/30 text-center"
                >
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors underline-offset-2 hover:underline">
                    Sign up
                  </Link>
                </motion.p>
              </div>
            </div>
          </div>

          {/* Bottom security badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <Lock className="h-3 w-3 text-white/15" />
            <span className="text-[11px] text-white/15">Secured with end-to-end encryption</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
