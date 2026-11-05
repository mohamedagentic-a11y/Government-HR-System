build/frontend-code/src/components/Navigation.tsx

```typescript
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { selectCurrentUser } from '../store/authSlice';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store/store';

type UserRole = 'HR Staff' | 'Manager' | 'Employee';

const translations = {
  ar: {
    appTitle: 'نظام الموارد البشرية',
    employeeDashboard: 'لوحة تحكم الموظف',
    leaveRequestForm: 'طلب إجازة',
    managerApprovalHub: 'مركز الموافقات',
    payrollProcessingHub: 'مركز معالجة الرواتب',
    orgChart: 'الهيكل التنظيمي',
    logout: 'تسجيل الخروج',
    language: 'English',
    loggedInAs: 'مسجل الدخول بصفة',
    roleHRStaff: 'موظف الموارد البشرية',
    roleManager: 'مدير',
    roleEmployee: 'موظف',
  },
  en: {
    appTitle: 'HR System',
    employeeDashboard: 'Employee Dashboard',
    leaveRequestForm: 'Leave Request',
    managerApprovalHub: 'Manager Approval Hub',
    payrollProcessingHub: 'Payroll Processing Hub',
    orgChart: 'Org Chart',
    logout: 'Logout',
    language: 'العربية',
    loggedInAs: 'Logged in as',
    roleHRStaff: 'HR Staff',
    roleManager: 'Manager',
    roleEmployee: 'Employee',
  },
};

interface NavItem {
  key: keyof typeof translations['ar'];
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    key: 'employeeDashboard',
    path: '/dashboard',
    roles: ['HR Staff', 'Manager', 'Employee'],
  },
  {
    key: 'leaveRequestForm',
    path: '/leave-request',
    roles: ['HR Staff', 'Manager', 'Employee'],
  },
  {
    key: 'managerApprovalHub',
    path: '/manager-approval',
    roles: ['Manager', 'HR Staff'],
  },
  {
    key: 'payrollProcessingHub',
    path: '/payroll',
    roles: ['HR Staff'],
  },
  {
    key: 'orgChart',
    path: '/org-chart',
    roles: ['HR Staff', 'Manager', 'Employee'],
  },
];

function roleLabel(
  role: UserRole | undefined,
  t: typeof translations['ar']
): string {
  if (!role) return '';
  if (role === 'HR Staff') return t.roleHRStaff;
  if (role === 'Manager') return t.roleManager;
  return t.roleEmployee;
}

export function Navigation(): JSX.Element {
  const { language, switchLanguage } = useI18n();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const t = language === 'ar' ? translations.ar : translations.en;
  const userRole = currentUser?.role as UserRole | undefined;

  const visibleItems = navItems.filter((item) => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  function handleLogout() {
    dispatch(logout());
    navigate('/dashboard');
  }

  function handleLanguageSwitch() {
    switchLanguage(language === 'ar' ? 'en' : 'ar');
  }

  return (
    <nav
      className="flex flex-col h-full bg-gray-900 text-white w-64 min-h-screen py-6 px-4"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* App Title */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-white">{t.appTitle}</h1>
        {currentUser && (
          <p className="text-xs text-gray-400 mt-1">
            {t.loggedInAs}: {roleLabel(userRole, t)}
          </p>
        )}
      </div>

      {/* Nav Links */}
      <ul className="flex-1 space-y-1">
        {visibleItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                [
                  'block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                ].join(' ')
              }
            >
              {t[item.key]}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Bottom Controls */}
      <div className="mt-6 space-y-2">
        {/* Language Switcher */}
        <button
          onClick={handleLanguageSwitch}
          className="w-full px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 text-start"
        >
          {t.language}
        </button>

        {/* Logout */}
        {currentUser && (
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors duration-150 text-start"
          >
            {t.logout}
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navigation;