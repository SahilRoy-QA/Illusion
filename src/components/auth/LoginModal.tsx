/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../../types/context.ts';
import { defaultPorts } from '../../data/index.ts';
import { authCopy } from '../../copy/auth.ts';
import { commonCopy } from '../../copy/common.ts';
import { User, Shield, KeyRound, ArrowLeft, CheckCircle2, Building, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onUserChanged }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'signin' | 'reset'>('signin');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('demo-pass-2026');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSubmitted, setResetSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      defaultPorts.auth.listDemoUsers().then((list) => {
        setUsers(list);
        defaultPorts.auth.getCurrentUser().then((current) => {
          if (current) {
            setSelectedUserId(current.id);
            setEmailInput(current.email);
          }
        });
      });
      setResetSubmitted(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDemoUser = (user: UserAccount) => {
    setSelectedUserId(user.id);
    setEmailInput(user.email);
    setErrorMessage('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      let targetUser = users.find((u) => u.id === selectedUserId);
      if (!targetUser && emailInput) {
        targetUser = users.find((u) => u.email.toLowerCase() === emailInput.toLowerCase());
      }

      if (!targetUser) {
        setErrorMessage('We could not find an account with that email. Please choose one of the demo profiles below.');
        setIsLoading(false);
        return;
      }

      const loggedIn = await defaultPorts.auth.login(targetUser.id);
      onUserChanged(loggedIn);
      onClose();
    } catch {
      setErrorMessage('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResetSubmitted(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        {activeTab === 'signin' ? (
          <div>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{authCopy.signInTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{authCopy.signInSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">{authCopy.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">{authCopy.passwordLabel}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(emailInput);
                      setActiveTab('reset');
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {authCopy.forgotPassword}
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading ? commonCopy.loading : authCopy.signInButton}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>{authCopy.quickDemoAccounts}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {users.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(user)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                        {user.role === 'super_admin' ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                            Admin
                          </span>
                        ) : user.role === 'business_admin' ? (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-900">
                            Owner
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                            Staff
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-[11px] text-slate-600">{user.customRoleLabel || user.role}</span>
                      <span className="mt-0.5 text-[10px] text-slate-500 truncate w-full">{user.email}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {authCopy.backToSignIn}
            </button>

            <h2 className="text-xl font-semibold text-slate-900">{authCopy.resetPasswordTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{authCopy.resetPasswordSubtitle}</p>

            {resetSubmitted ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900">Instructions Sent</h3>
                    <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                      {authCopy.resetSuccessMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800"
                >
                  {authCopy.backToSignIn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{authCopy.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading ? commonCopy.loading : authCopy.sendResetLink}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
