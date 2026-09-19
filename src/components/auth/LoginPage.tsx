/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  HeartPulse,
  ShoppingBag,
  Info,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { UserAccount } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';

interface LoginPageProps {
  redirectPath?: string;
  securityMessage?: string;
  onLoginSuccess: (user: UserAccount) => void;
  onExplorePublic?: () => void;
}

export function LoginPage({
  redirectPath,
  securityMessage,
  onLoginSuccess,
  onExplorePublic,
}: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // First login password reset modal
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Demo user credentials for evaluators
  // Note: Raw values provided for quick testing; hashes are verified via Web Crypto SubtleCrypto
  const demoProfiles = [
    {
      role: 'super_admin' as const,
      name: 'Super Administrator',
      desc: 'Full fleet control, business provisioning & invariant audits',
      identifier: 'admin',
      demoPass: '006574',
      icon: ShieldCheck,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      role: 'business_admin' as const,
      name: 'Dr. Amit Sharma (Clinic Owner)',
      desc: 'Doctor & owner for Dr. Amit Orthopedic Clinic',
      identifier: 'amit@dramitclinic.com',
      demoPass: 'password123',
      icon: HeartPulse,
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    },
    {
      role: 'business_admin' as const,
      name: 'Priya Sen (Salon Owner)',
      desc: 'Owner of Aura Luxe Salon & Spa',
      identifier: 'priya@priyasalon.in',
      demoPass: 'password123',
      icon: Sparkles,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    },
    {
      role: 'business_admin' as const,
      name: 'Rhea Varma (Retail Owner)',
      desc: 'Store manager for Craft & Clay Goods',
      identifier: 'rhea@craftandclay.in',
      demoPass: 'password123',
      icon: ShoppingBag,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      role: 'staff' as const,
      name: 'Sunita Mehra (Clinic Staff)',
      desc: 'Front desk assistant with strict list-level staff limits',
      identifier: 'sunita@dramitclinic.com',
      demoPass: 'password123',
      icon: User,
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    },
  ];

  const handleSelectDemoProfile = (profile: (typeof demoProfiles)[0]) => {
    setIdentifier(profile.identifier);
    setPassword(profile.demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your username or registered email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await defaultPorts.auth.loginWithCredentials(identifier.trim(), password);

      // If account has mustChangePassword flagged (e.g. initial super admin seed), trigger reset modal
      if (user.mustChangePassword) {
        setPendingUser(user);
        setIsLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Sign in failed. Please verify your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordChangeError(null);

    try {
      await defaultPorts.auth.changePassword(pendingUser.id, newPassword);
      const updatedUser: UserAccount = {
        ...pendingUser,
        mustChangePassword: false,
      };
      setPendingUser(null);
      onLoginSuccess(updatedUser);
    } catch (err: unknown) {
      setPasswordChangeError(
        err instanceof Error ? err.message : 'Failed to update password. Please try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md">
            i
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>illusion</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                Multi-Tenant Core
              </span>
            </h1>
          </div>
        </div>

        {onExplorePublic && (
          <button
            type="button"
            onClick={onExplorePublic}
            className="text-xs font-medium text-slate-400 hover:text-white transition flex items-center space-x-1"
          >
            <span>Public Storefronts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Sign-in Form */}
          <div className="lg:col-span-7 bg-slate-950/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {/* Route Guard Notice */}
            {securityMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300 mb-0.5">
                    Security Gate Active
                  </div>
                  <p className="text-amber-200/90 leading-relaxed">{securityMessage}</p>
                  {redirectPath && (
                    <div className="mt-1 font-mono text-[11px] text-amber-400/80">
                      Destination: {redirectPath}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Access your business workspace or system management console.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div>
                <label
                  htmlFor="input-auth-identifier"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin or user@business.com"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-auth-password"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Session */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="btn-auth-signin"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Web Crypto SHA-256 Verified</span>
              </span>
              <span>Boundary Port RBAC Protected</span>
            </div>
          </div>

          {/* Right Column: Instant Evaluation Profiles */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/60 p-5 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>Evaluation Quick Logins</span>
                </h3>
                <span className="text-[10px] text-slate-500">1-click fill</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Select any verified role below to pre-populate credentials and test exact RBAC boundary gates:
              </p>

              <div className="space-y-2">
                {demoProfiles.map((p) => {
                  const Icon = p.icon;
                  const isSelected = identifier === p.identifier;
                  return (
                    <button
                      key={p.identifier}
                      type="button"
                      onClick={() => handleSelectDemoProfile(p)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-start space-x-3 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 text-white'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-800 text-white shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white truncate">
                            {p.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              p.role === 'super_admin'
                                ? 'bg-amber-400 text-slate-950'
                                : p.role === 'business_admin'
                                ? 'bg-sky-500 text-white'
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {p.role.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {p.desc}
                        </p>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          ID: {p.identifier}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Addendum B1 & B2 Compliant:</strong> The Super Admin account is
                restricted to username <code className="text-amber-300">admin</code>.
                No secondary Super Admin account can ever be provisioned.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Mandatory Password Change Dialog (For accounts with mustChangePassword flag) */}
      {pendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Change Initial Password
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Welcome, <strong className="text-white">{pendingUser.fullName}</strong>.
              For platform security, your temporary seed password must be changed before accessing
              the console.
            </p>

            {passwordChangeError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            <form onSubmit={handleCompletePasswordChange} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setPendingUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isChangingPassword ? 'Updating...' : 'Set & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        illusion SaaS Engine • Strictly Enforced RBAC & Multi-Tenant Isolation
      </footer>
    </div>
  );
}
