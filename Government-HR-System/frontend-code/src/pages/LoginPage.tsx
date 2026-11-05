import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { post } from '../lib/apiClient';
import { persistToken } from '../lib/apiClient';
import { login } from '../store/authSlice';

const translations = {
  ar: {
    pageTitle: 'نظام الموارد البشرية الحكومي',
    subtitle: 'بوابة الدخول الموحد',
    ssoTokenLabel: 'رمز الدخول الموحد (SSO)',
    ssoTokenPlaceholder: 'أدخل رمز الدخول الموحد',
    loginButton: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول...',
    errorRequired: 'رمز الدخول الموحد مطلوب',
    errorGeneric: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    languageToggle: 'English',
    welcomeBack: 'مرحباً بك',
    description: 'قم بتسجيل الدخول باستخدام رمز الدخول الموحد الخاص بك',
  },
  en: {
    pageTitle: 'Government HR System',
    subtitle: 'Single Sign-On Portal',
    ssoTokenLabel: 'SSO Token',
    ssoTokenPlaceholder: 'Enter your SSO token',
    loginButton: 'Sign In',
    loggingIn: 'Signing in...',
    errorRequired: 'SSO token is required',
    errorGeneric: 'Sign in failed. Please try again.',
    languageToggle: 'عربي',
    welcomeBack: 'Welcome Back',
    description: 'Sign in using your Single Sign-On token',
  },
};

interface SSOResponse {
  token: string;
  employeeId: string;
  role: string;
}

export function LoginPage() {
  const { language, switchLanguage } = useI18n();
  const t = translations[language as keyof typeof translations] ?? translations.ar;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [ssoToken, setSsoToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ssoToken.trim()) {
      setError(t.errorRequired);
      return;
    }

    setLoading(true);
    try {
      const response = await post<SSOResponse>('/api/v1/auth/sso', { ssoToken: ssoToken.trim() });

      persistToken(response.token);

      dispatch(
        login({
          token: response.token,
          user: {
            employeeId: response.employeeId,
            role: response.role as import('../store/authSlice').UserRole,
          },
        })
      );

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.errorGeneric;
      setError(message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = () => {
    switchLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-full shadow-sm border border-emerald-200 transition-colors"
          >
            {t.languageToggle}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-8 py-8 text-center">
            {/* Ministry Emblem Placeholder */}
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-9 h-9 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.pageTitle}</h1>
            <p className="text-green-100 text-sm">{t.subtitle}</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800">{t.welcomeBack}</h2>
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label
                  htmlFor="ssoToken"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t.ssoTokenLabel}
                </label>
                <input
                  id="ssoToken"
                  type="password"
                  autoComplete="current-password"
                  value={ssoToken}
                  onChange={(e) => setSsoToken(e.target.value)}
                  placeholder={t.ssoTokenPlaceholder}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    error
                      ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400'
                  }`}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
                >
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !ssoToken.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {t.loggingIn}
                  </span>
                ) : (
                  t.loginButton
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;