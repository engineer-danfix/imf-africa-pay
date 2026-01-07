/// <reference types="vite/client" />

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';

// Helper to get backend URL - use the backend URL when deployed separately
// This allows the frontend to work with a separate backend deployment
const API_BASE = import.meta.env.VITE_API_URL || 'https://imf-africa-pay-backend.onrender.com';

interface FormData {
  name: string;
  email: string;
  phone: string;
  plan: string;
  amount: number;
}

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    email: '',
    phone: '',
    plan: '',
    amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.phone || !formData.plan) {
      setError('All fields are required');
      showToast('All fields are required', 'error');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit payment');
      }

      showToast('Payment details submitted successfully!', 'success');
      navigate('/bank-transfer', { state: { plan: { name: formData.plan, price: `$${formData.amount}`, amount: formData.amount } } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please try again.');
      showToast(err.message || 'Failed to submit payment. Please try again.', 'error');
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
          <h1 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Complete Payment Details</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please fill in your details to proceed with the payment.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Full Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your full name"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Email Address:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your email address"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your phone number"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Select Plan:</label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={loading}
              required
            >
              <option value="">Choose a plan</option>
              <option value="Membership Only">Membership Only (₦75,000)</option>
              <option value="Renewal Only">Renewal Only (₦75,000)</option>
              <option value="Membership and Licensing">Membership and Licensing (₦125,000)</option>
              <option value="Membership and Ordination">Membership and Ordination (₦125,000)</option>
              <option value="Membership, Licensing and Ordination">Membership, Licensing and Ordination (₦175,000)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Amount (₦):</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter amount in Naira"
              disabled={loading}
              required
            />
          </div>
          
          {error && <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">{error}</div>}
          
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all mt-4 flex items-center justify-center disabled:opacity-70 text-sm"
            disabled={loading}
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
              'Submit Details'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default FormPage;