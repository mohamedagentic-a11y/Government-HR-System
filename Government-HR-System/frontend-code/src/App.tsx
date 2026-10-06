import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { createContext, useState, useEffect } from 'react';
import { LeaveRequestPage } from './pages/LeaveRequestPage';
import { PayrollPage } from './pages/PayrollPage';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
});

const DICTIONARY = {
  en: {
    navLeave: 'Leave Requests',
    navPayroll: 'Payroll',
    notFound: 'Page Not Found',
    toggleLang: 'عربي',
  },
  ar: {
    navLeave: 'طلبات الإجازة',
    navPayroll: 'مسير الرواتب',
    notFound: 'الصفحة غير موجودة',
    toggleLang: 'English',
  },
};

export function App() {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = DICTIONARY[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <nav className="flex gap-6 items-center">
              <Link to="/leave-request" className="text-sm font-medium hover:text-blue-600 transition-colors">
                {t.navLeave}
              </Link>
              <Link to="/payroll" className="text-sm font-medium hover:text-blue-600 transition-colors">
                {t.navPayroll}
              </Link>
            </nav>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {t.toggleLang}
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/leave-request" replace />} />
            <Route path="/leave-request" element={<LeaveRequestPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-64 text-gray-500">
                  {t.notFound}
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </LanguageContext.Provider>
  );
}