import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Lazy load components for better performance
const PlanSelection = lazy(() => import('./pages/PlanSelection'));
const BankDetailsUpload = lazy(() => import('./pages/BankDetailsUpload'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const FinalThankYou = lazy(() => import('./pages/FinalThankYou'));
const FormPage = lazy(() => import('./pages/FormPage'));
const ExistingUserForm = lazy(() => import('./pages/ExistingUserForm'));

const App: React.FC = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check system preference for dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/imf-logo.png" alt="IMF Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">IMF Africa Pay</h1>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PlanSelection />} />
            <Route path="/existing-user" element={<ExistingUserForm />} />
            <Route path="/bank-details" element={<BankDetailsUpload />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/thank-you" element={<FinalThankYou />} />
            <Route path="/form" element={<FormPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} International Ministers Forum. All rights reserved.</p>
          <p className="mt-2 text-sm">Secure payment processing powered by IMF Africa Pay</p>
        </div>
      </footer>
    </div>
  );
};

export default App;