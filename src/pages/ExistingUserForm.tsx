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
  const [userType, setUserType] = useState<'membership' | 'licensed' | null>(null);
  const [formData, setFormData] = useState({
    membershipNumber: '',
    licenseNumber: '',
    fullName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validation
    if (!userType) {
      showToast('Please select a user type', 'error');
      setSubmitting(false);
      return;
    }
    
    if (!formData.fullName.trim()) {
      showToast('Please enter your full name', 'error');
      setSubmitting(false);
      return;
    }
    
    if (userType === 'membership' && !formData.membershipNumber.trim()) {
      showToast('Please enter your membership number', 'error');
      setSubmitting(false);
      return;
    }
    
    if (userType === 'licensed' && !formData.licenseNumber.trim()) {
      showToast('Please enter your license number', 'error');
      setSubmitting(false);
      return;
    }
    
    try {
      // In a real application, you would validate the user details with your backend
      // For now, we'll just navigate to the form page
      const res = await fetch(`${API_BASE}/api/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: '', // Not collected in this form, but required by backend
          phone: '', // Not collected in this form, but required by backend
          plan: userType === 'membership' ? 'Membership Verification' : 'Licensed Verification',
          amount: 0
        }),
      });
      
      if (!res.ok) throw new Error('Failed to verify user');
      const result = await res.json();
      
      if (result.success) {
        showToast('Verification successful! Redirecting to form...', 'success');
        setTimeout(() => {
          navigate('/form');
        }, 1500);
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Existing User Verification
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          Please select your user type and provide the required information
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3">User Type *</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  checked={userType === 'membership'}
                  onChange={() => setUserType('membership')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Membership</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  checked={userType === 'licensed'}
                  onChange={() => setUserType('licensed')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Licensed</span>
              </label>
            </div>
          </div>
          
          {userType === 'membership' && (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Membership Number *</label>
              <input
                type="text"
                name="membershipNumber"
                value={formData.membershipNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your membership number"
              />
            </div>
          )}
          
          {userType === 'licensed' && (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">IMF License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your license number"
              />
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-all"
            disabled={submitting}
          >
            {submitting ? 'Verifying...' : 'Next'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ExistingUserForm;