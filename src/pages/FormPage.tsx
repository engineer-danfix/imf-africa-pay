import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  // Redirect to home page since form functionality is removed
  React.useEffect(() => {
    // Wait a moment to show a message before redirecting
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-8 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7 }} 
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700 dark:text-blue-400">Payment Already Completed</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You've already completed the payment process. Redirecting to homepage...
        </p>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </motion.div>
    </div>
  );
};

export default FormPage;