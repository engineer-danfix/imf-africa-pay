/// <reference types="vite/client" />

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';

// Helper to get backend URL - use the backend URL when deployed separately
// This allows the frontend to work with a separate backend deployment
const API_BASE = import.meta.env.VITE_API_URL || 'https://imf-africa-pay-backend.onrender.com';

const ExistingUserForm: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedOption, setSelectedOption] = useState<'membership' | 'licensed' | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedOption) {
      setError('Please select an option');
      showToast('Please select an option', 'error');
      return;
    }

    if (!identifier.trim() || !fullName.trim()) {
      setError('Please enter both identifier and full name');
      showToast('Please enter both identifier and full name', 'error');
      return;
    }

    setLoading(true);
    try {
      // Submit the existing user data to the backend
      const res = await fetch(`${API_BASE}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email: '', // Will be collected in next step if needed
          phone: '', // Will be collected in next step if needed
          plan: `${selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)} Renewal`,
          amount: 0 // Amount will be determined by the plan selection later
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit user details');
      }

      showToast('Payment details submitted successfully!', 'success');
      // Navigate directly to success page after submission
      navigate('/success', { state: { 
        plan: `${selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)} Renewal`,
        existingUser: true,
        userData: {
          selectedOption,
          identifier,
          fullName
        }
      } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit user details. Please try again.');
      showToast(err.message || 'Failed to submit user details. Please try again.', 'error');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Existing User Payment</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please select your user type and provide the required information.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col space-y-3">
            <label className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Select User Type:</label>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setSelectedOption('membership')}
                className={`flex-1 border rounded-lg py-2.5 px-3 text-sm ${
                  selectedOption === 'membership'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Membership
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedOption('licensed')}
                className={`flex-1 border rounded-lg py-2.5 px-3 text-sm ${
                  selectedOption === 'licensed'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Licensed
              </button>
            </div>
          </div>
          
          {selectedOption && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">
                {selectedOption === 'membership' ? 'Membership Number:' : 'IMF License Number:'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder={
                  selectedOption === 'membership' 
                    ? 'Enter your membership number' 
                    : 'Enter your IMF license number'
                }
                disabled={loading}
                required
              />
            </div>
          )}
          
          {selectedOption && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">
                Full Name:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
          )}
          
          {error && <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">{error}</div>}
          
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all mt-4 flex items-center justify-center disabled:opacity-70 text-sm"
            disabled={loading || !selectedOption}
          >
            {loading ? (
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

export default ExistingUserForm;