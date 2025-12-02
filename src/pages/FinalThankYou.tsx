import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const FinalThankYou: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-12 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <svg width="70" height="70" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#2563eb" />
            <motion.path
              d="M24 40L36 52L56 32"
              stroke="#fff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </svg>
        </motion.div>
        <h1 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-400 text-center">Thank You!</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-center text-sm">
          Your application is complete. We appreciate your trust in IMF.
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all mt-2 w-full text-sm"
          onClick={() => navigate('/')}
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FinalThankYou;