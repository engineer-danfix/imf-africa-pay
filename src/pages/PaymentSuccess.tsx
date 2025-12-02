import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/form', { state: { plan } });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, plan]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 py-12 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <svg width="70" height="70" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#22c55e" />
            <motion.path
              d="M24 42L36 54L56 34"
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
        <h1 className="text-xl font-bold mb-2 text-green-700 dark:text-green-400 text-center">Payment Successful!</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-center text-sm">
          Thank you for your payment. A receipt has been sent to your email.
        </p>
        {plan && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-gray-700 rounded-lg text-center w-full">
            <div className="text-sm text-gray-600 dark:text-gray-300">Processed Plan:</div>
            <div className="font-bold text-base text-green-700 dark:text-green-400">{plan.name} ({plan.price})</div>
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all mt-2 w-full text-sm"
          onClick={() => navigate('/form', { state: { plan } })}
        >
          Continue to Application Form
        </motion.button>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Redirecting to form in 3 seconds...
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;