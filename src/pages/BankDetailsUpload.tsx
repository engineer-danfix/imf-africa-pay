/// <reference types="vite/client" />

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';

const BANK_DETAILS = {
  bankName: 'Zenith Bank',
  accountName: 'FIRST INTL GOSPEL MINISTERS FORUM',
  accountNumber: '1223664859',
};

// Helper to get backend URL (adjust for production as needed)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const BankDetailsUpload: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const plan = location.state?.plan;

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError('Only JPG, PNG, or PDF files are allowed.');
        showToast('Only JPG, PNG, or PDF files are allowed.', 'error');
        return;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        showToast('File size must be less than 5MB.', 'error');
        return;
      }
      setFile(f);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your payment receipt.');
      showToast('Please upload your payment receipt.', 'error');
      return;
    }
    if (!name || !email) {
      setError('Please enter your name and email.');
      showToast('Please enter your name and email.', 'error');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Create FormData object for multipart/form-data
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('amount', (plan?.amount || 0).toString());
      formData.append('serviceType', plan?.name || '');
      formData.append('reference', `IMF-${Date.now()}`);
      
      const res = await fetch(`${API_BASE}/api/send-transfer-receipt`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await res.json();
      if (!result.success) {
        showToast(result.error || 'Failed to submit payment', 'error');
        throw new Error(result.error || 'Failed to submit payment');
      }
      showToast('Payment submitted successfully!', 'success');
      navigate('/success', { state: { plan } });
    } catch (err: any) {
      setError(err.message || 'Failed to upload receipt. Please try again.');
      showToast(err.message || 'Failed to upload receipt. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Bank Transfer Details</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please transfer the amount to the account details below and upload your payment receipt.
          </p>
        </div>
        
        <div className="mb-8 p-5 bg-blue-50 dark:bg-gray-700 rounded-xl">
          <h2 className="text-lg font-bold mb-4 text-center text-gray-800 dark:text-white">Bank Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
              <span className="font-medium text-gray-600 dark:text-gray-300">Bank Name:</span>
              <span className="font-semibold text-gray-800 dark:text-white">{BANK_DETAILS.bankName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
              <span className="font-medium text-gray-600 dark:text-gray-300">Account Name:</span>
              <span className="font-semibold text-gray-800 dark:text-white">{BANK_DETAILS.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600 dark:text-gray-300">Account Number:</span>
              <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400">{BANK_DETAILS.accountNumber}</span>
            </div>
          </div>
        </div>
        
        {plan && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-gray-700 rounded-lg text-center">
            <div className="text-sm text-gray-600 dark:text-gray-300">Selected Plan:</div>
            <div className="font-bold text-base text-green-700 dark:text-green-400">{plan.name} ({plan.price})</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Your Name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your full name"
              disabled={uploading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Your Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your email address"
              disabled={uploading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Upload Payment Receipt:</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-100 dark:hover:file:bg-blue-800 cursor-pointer text-sm"
                disabled={uploading}
                required
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Accepted formats: JPG, PNG, or PDF. Maximum file size: 5MB.
            </p>
          </div>
          
          {error && <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">{error}</div>}
          
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all mt-2 flex items-center justify-center disabled:opacity-70 text-sm"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Submit Payment'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default BankDetailsUpload;