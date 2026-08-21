import React, { useState } from 'react';
import { 
  Building2, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
export interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<any>;
  loading: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loading }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('student1@test.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      localStorage.setItem('mock_admin_mode', String(isAdminMode));
      await onLogin(email, password);
      if (isAdminMode) {
        window.location.hash = '#admin';
      } else {
        window.location.hash = '#new_query';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-app-base text-app-text-primary font-sans flex antialiased">
      {/* Left Panel: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between border-r border-app-border-subtle bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-app-surface to-app-base relative overflow-hidden">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-app-accent-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-app-accent-info/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 space-y-16 flex-1">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-app-accent-primary to-app-accent-active flex items-center justify-center shadow-lg shadow-app-accent-primary/20">
              <Building2 className="w-5 h-5 text-app-base" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-app-text-primary">CampusConnect</span>
          </div>

          {/* Copy Section */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-extrabold leading-tight text-app-text-primary tracking-tight">
              Smarter requests. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-accent-primary to-app-accent-active">
                Stronger institutions.
              </span>
            </h1>
            <p className="text-lg text-app-text-secondary leading-relaxed">
              The unified operating system for campus workflows, issue resolution, and AI-powered service delivery.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-app-surface-raised border border-app-border-subtle mt-1">
                <Zap className="w-5 h-5 text-app-accent-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text-primary">Instant Triage</h3>
                <p className="text-sm text-app-text-secondary mt-1">AI-powered routing sends requests to the right department instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-app-surface-raised border border-app-border-subtle mt-1">
                <Clock className="w-5 h-5 text-app-accent-active" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text-primary">Real-time Tracking</h3>
                <p className="text-sm text-app-text-secondary mt-1">Full visibility into SLA statuses and approval chains.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-app-surface-raised border border-app-border-subtle mt-1">
                <ShieldCheck className="w-5 h-5 text-app-accent-complete" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text-primary">Enterprise Security</h3>
                <p className="text-sm text-app-text-secondary mt-1">Role-based access control and immutable audit logs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="relative z-10 flex items-center gap-3 p-4 rounded-xl bg-app-surface border border-app-border-subtle w-max shadow-sm backdrop-blur-sm">
          <ShieldAlert className="w-5 h-5 text-app-text-secondary" />
          <span className="text-sm font-medium text-app-text-secondary">Enterprise-grade security & compliance</span>
        </div>
      </div>

      {/* Right Panel: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-app-accent-primary to-app-accent-active flex items-center justify-center">
              <Building2 className="w-4 h-4 text-app-base" />
            </div>
            <span className="text-xl font-bold tracking-tight">CampusConnect</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-app-text-primary">Welcome back</h2>
            <p className="text-app-text-secondary">Please enter your details to sign in.</p>
          </div>

          {/* Login Card */}
          <div className="bg-app-surface border border-app-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 relative">
            
            {/* Toggle (Cosmetic for demo) */}
            <div className="flex p-1 bg-app-base rounded-lg border border-app-border-subtle mb-8">
              <button
                type="button"
                onClick={() => setIsAdminMode(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isAdminMode ? 'bg-app-surface-raised text-app-text-primary shadow-sm border border-app-border-subtle' : 'text-app-text-secondary hover:text-app-text-primary'}`}
              >
                User Login
              </button>
              <button
                type="button"
                onClick={() => setIsAdminMode(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isAdminMode ? 'bg-app-surface-raised text-app-text-primary shadow-sm border border-app-border-subtle' : 'text-app-text-secondary hover:text-app-text-primary'}`}
              >
                Admin Login
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-primary block">
                  {isAdminMode ? 'Admin Email / Username' : 'Email address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-app-text-secondary" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-app-base border border-app-border-subtle rounded-lg text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary focus:border-app-accent-primary transition-colors text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-app-text-primary block">Password</label>
                  <a href="#" className="text-xs font-semibold text-app-accent-primary hover:text-app-accent-active transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-app-text-secondary" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-app-base border border-app-border-subtle rounded-lg text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary focus:border-app-accent-primary transition-colors text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-text-secondary hover:text-app-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-app-accent-critical/10 border border-app-accent-critical/20 rounded-lg text-app-accent-critical text-sm text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-app-accent-primary to-app-accent-active text-app-base font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-app-accent-primary/20 mt-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-app-border-subtle"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-app-surface text-app-text-secondary">or</span>
              </div>
            </div>

            {/* Social Login (Decorative) */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-app-base border border-app-border-subtle text-app-text-primary font-semibold text-sm hover:bg-app-surface-raised transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            {/* Signup Link */}
            <p className="mt-8 text-center text-sm text-app-text-secondary">
              New here?{' '}
              <a href="#" className="font-semibold text-app-text-primary hover:text-app-accent-primary transition-colors">
                Create an account
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-app-text-secondary">
              By signing in, you agree to our{' '}
              <a href="#" className="underline hover:text-app-text-primary">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-app-text-primary">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
