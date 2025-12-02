import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-8 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 flex flex-col items-center"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Complete Your Application</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please fill out the form below to complete your application process.
          </p>
        </div>
        
        {plan && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg text-center w-full">
            <div className="text-sm text-gray-600 dark:text-gray-300">Selected Plan:</div>
            <div className="font-bold text-base text-blue-700 dark:text-blue-400">{plan.name} ({plan.price})</div>
          </div>
        )}
        
        <div className="w-full h-[60vh] mb-6">
          <iframe
            style={{ height: '100%', width: '100%' }}
            width="100%"
            height="100%"
            src="https://formshare.ai/r/hINIyYKq2r"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title="IMF Application Form"
            className="rounded-lg border border-gray-200 dark:border-gray-700 shadow"
          />
        </div>
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition-all w-full sm:w-auto text-sm"
          onClick={() => navigate('/thank-you', { state: { plan } })}
        >
          Finish Application
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FormPage;