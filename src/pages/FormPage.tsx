/// <reference types="vite/client" />

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const plan = location.state?.plan; // Get plan from previous page if available

  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    organization: '',
    position: '',
    country: '',
    state: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields (First Name, Last Name, Email, Phone)');
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    // In a real implementation, you would save the form data to your backend
    setTimeout(() => {
      setLoading(false);
      showToast('Form submitted successfully!', 'success');
      // Navigate to thank you page after form submission
      navigate('/thank-you', { state: { plan } });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Complete Your Information</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please fill in your details to complete your application.
          </p>
          {plan && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300">Selected Plan:</div>
              <div className="font-bold text-base text-green-700 dark:text-green-400">{plan.name || plan}</div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your first name"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your last name"
              disabled={loading}
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Email *</label>
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
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Phone *</label>
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
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your country"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">State/Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your state"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your city"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your address"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Organization</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your organization"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your position"
              disabled={loading}
            />
          </div>
          
          {error && <div className="md:col-span-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">{error}</div>}
          
          <div className="md:col-span-2 mt-4 flex justify-center">
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow transition-all flex items-center justify-center disabled:opacity-70 text-sm"
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
                'Finish'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FormPage;