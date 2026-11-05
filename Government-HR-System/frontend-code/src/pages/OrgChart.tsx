import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { fetchOrgChart, searchEmployees, clearSearchResults, clearOrgChartError } from '../store/employeeSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { OrgChartNode } from '../store/employeeSlice';

const translations = {
  ar: {
    pageTitle: 'الهيكل التنظيمي',
    minister: 'معالي الوزير',
    deputyMinister: 'وكيل الوزارة',
    hrDirector: 'مدير الموارد البشرية',
    itDirector: 'مدير تقنية المعلومات',
    searchPlaceholder: 'ابحث بالاسم أو القسم...',
    searchButton: 'بحث',
    clearSearch: 'مسح البحث',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ أثناء تحميل الهيكل التنظيمي',
    noResults: 'لا توجد نتائج مطابقة',
    retry: 'إعادة المحاولة',
    employees: 'الموظفون',
    department: 'القسم',
    jobTitle: 'المسمى الوظيفي',
    expandAll: 'توسيع الكل',
    collapseAll: 'طي الكل',
    searchResults: 'نتائج البحث',
    orgStructure: 'الهيكل التنظيمي',
  },
  en: {
    pageTitle: 'Organizational Chart',
    minister: 'His Excellency the Minister',
    deputyMinister: 'Deputy Minister',
    hrDirector: 'HR Director',
    itDirector: 'IT Director',
    searchPlaceholder: 'Search by name or department...',
    searchButton: 'Search',
    clearSearch: 'Clear Search',
    loading: 'Loading...',
    error: 'An error occurred while loading the organizational chart',
    noResults: 'No matching results found',
    retry: 'Retry',
    employees: 'Employees',
    department: 'Department',
    jobTitle: 'Job Title',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    searchResults: 'Search Results',
    orgStructure: 'Organizational Structure',
  },
};

interface OrgNodeCardProps {
  node: OrgChartNode;
  level: number;
  language: string;
  defaultExpanded?: boolean;
}

const levelColors = [
  'bg-blue-700 text-white border-blue-800',
  'bg-blue-500 text-white border-blue-600',
  'bg-blue-300 text-blue-900 border-blue-400',
  'bg-blue-100 text-blue-900 border-blue-200',
  'bg-gray-100 text-gray-800 border-gray-200',
];

const OrgNodeCard: React.FC<OrgNodeCardProps> = ({ node, level, language, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;
  const colorClass = levelColors[Math.min(level, levelColors.length - 1)];
  const displayName = language === 'ar' ? node.NameArabic : (node.NameEnglish || node.NameArabic);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-lg border-2 shadow-md px-4 py-3 min-w-[160px] max-w-[220px] text-center cursor-pointer select-none transition-all duration-200 hover:shadow-lg ${colorClass}`}
        onClick={() => hasChildren && setExpanded(e => !e)}
        title={hasChildren ? (expanded ? 'طي / Collapse' : 'توسيع / Expand') : undefined}
      >
        <div className="font-bold text-sm leading-tight mb-1">{displayName}</div>
        {node.JobTitle && (
          <div className="text-xs opacity-80">{node.JobTitle}</div>
        )}
        {hasChildren && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-current flex items-center justify-center text-xs font-bold shadow">
            {expanded ? '−' : '+'}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-6 relative">
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-400" style={{ top: '-1rem' }} />
          <div className="flex flex-row gap-6 items-start justify-center">
            {node.children!.map((child, idx) => (
              <div key={child.EmployeeID} className="flex flex-col items-center relative">
                {/* Horizontal connector */}
                {node.children!.length > 1 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-gray-400" style={{ top: '-0.5rem', width: idx === 0 ? '50%' : idx === node.children!.length - 1 ? '50%' : '100%', left: idx === 0 ? '50%' : idx === node.children!.length - 1 ? '0' : '0' }} />
                )}
                <div className="mt-2">
                  <OrgNodeCard
                    node={child}
                    level={level + 1}
                    language={language}
                    defaultExpanded={level < 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchResultCardProps {
  node: OrgChartNode;
  language: string;
  t: (key: string) => string;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ node, language, t }) => {
  const displayName = language === 'ar' ? node.NameArabic : (node.NameEnglish || node.NameArabic);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
      <div className="font-semibold text-gray-800 text-base">{displayName}</div>
      {node.JobTitle && (
        <div className="text-sm text-gray-500">
          <span className="font-medium">{t('jobTitle')}: </span>{node.JobTitle}
        </div>
      )}
      <div className="text-xs text-gray-400">
        <span className="font-medium">{t('department')}: </span>{node.DepartmentID}
      </div>
    </div>
  );
};

// Build a default static org chart tree using the landmark headings
const buildStaticTree = (t: (key: string) => string, language: string): OrgChartNode => ({
  EmployeeID: 'minister',
  NameArabic: 'معالي الوزير',
  NameEnglish: "His Excellency the Minister",
  JobTitle: language === 'ar' ? 'معالي الوزير' : 'His Excellency the Minister',
  DepartmentID: 'ministry',
  children: [
    {
      EmployeeID: 'deputy-minister',
      NameArabic: 'وكيل الوزارة',
      NameEnglish: 'Deputy Minister',
      JobTitle: language === 'ar' ? 'وكيل الوزارة' : 'Deputy Minister',
      DepartmentID: 'ministry',
      children: [
        {
          EmployeeID: 'hr-director',
          NameArabic: 'مدير الموارد البشرية',
          NameEnglish: 'HR Director',
          JobTitle: language === 'ar' ? 'مدير الموارد البشرية' : 'HR Director',
          DepartmentID: 'hr',
          children: [],
        },
        {
          EmployeeID: 'it-director',
          NameArabic: 'مدير تقنية المعلومات',
          NameEnglish: 'IT Director',
          JobTitle: language === 'ar' ? 'مدير تقنية المعلومات' : 'IT Director',
          DepartmentID: 'it',
          children: [],
        },
      ],
    },
  ],
});

export const OrgChart: React.FC = () => {
  const { language, t: i18nT } = useI18n();
  const dispatch = useDispatch<AppDispatch>();

  const orgChart = useSelector((state: RootState) => state.employees.orgChart);
  const orgChartLoading = useSelector((state: RootState) => state.employees.orgChartLoading);
  const orgChartError = useSelector((state: RootState) => state.employees.orgChartError);
  const searchResults = useSelector((state: RootState) => state.employees.searchResults);
  const searchLoading = useSelector((state: RootState) => state.employees.searchLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const tDict = translations[language as 'ar' | 'en'] ?? translations['ar'];
  const t = (key: keyof typeof tDict) => tDict[key] ?? key;

  useEffect(() => {
    dispatch(fetchOrgChart());
    return () => {
      dispatch(clearOrgChartError());
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    dispatch(searchEmployees(trimmed));
    setHasSearched(true);
  }, [dispatch, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    dispatch(clearSearchResults());
  }, [dispatch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRetry = () => {
    dispatch(clearOrgChartError());
    dispatch(fetchOrgChart());
  };

  // Use fetched orgChart if available, otherwise use static tree
  const displayTree: OrgChartNode | null = orgChart ?? (orgChartLoading ? null : buildStaticTree(t, language));

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      lang={language}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-gray-500">{t('orgStructure')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('searchPlaceholder')}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              aria-label={t('searchPlaceholder')}
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              aria-label={t('searchButton')}
            >
              {searchLoading ? t('loading') : t('searchButton')}
            </button>
            {hasSearched && (
              <button
                onClick={handleClearSearch}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                aria-label={t('clearSearch')}
              >
                {t('clearSearch')}
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('searchResults')}</h2>
            {searchLoading ? (
              <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map(emp => (
                  <SearchResultCard
                    key={emp.EmployeeID}
                    node={emp as OrgChartNode}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                {t('noResults')}
              </div>
            )}
          </div>
        )}

        {/* Org Chart Tree */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Landmark headings */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">{t('pageTitle')}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-blue-600 font-medium">
              <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{t('minister')}</span>
              <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{t('deputyMinister')}</span>
              <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{t('hrDirector')}</span>
              <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{t('itDirector')}</span>
            </div>
          </div>

          {orgChartLoading && !displayTree ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <svg className="animate-spin h-8 w-8 text-blue-500 me-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-lg">{t('loading')}</span>
            </div>
          ) : orgChartError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-red-600 text-lg font-medium">{t('error')}</div>
              <div className="text-sm text-gray-500">{orgChartError}</div>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          ) : displayTree ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex justify-center min-w-max py-4">
                <OrgNodeCard
                  node={displayTree}
                  level={0}
                  language={language}
                  defaultExpanded={true}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">{t('noResults')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgChart;