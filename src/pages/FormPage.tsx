/// <reference types="vite/client" />

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  // Optionally, you could add logic to detect form submission and auto-redirect
  // For now, provide a button for the user to continue

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-8 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7 }} 
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 flex flex-col items-center"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700 dark:text-blue-400">Complete Your Application</h1>
        <div className="w-full h-[70vh] mb-6">
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
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.03 }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all"
          onClick={() => navigate('/thank-you', { state: { plan } })}
        >
          Finish &amp; Submit
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FormPage;
