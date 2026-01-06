import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ExistingUserForm: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'membership' | 'licensed' | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    membershipNumber: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUserTypeSelect = (type: 'membership' | 'licensed') => {
    setUserType(type);
    // Clear previous data when switching types
    setFormData({
      fullName: '',
      membershipNumber: '',
      licenseNumber: ''
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (userType === 'membership' && !formData.membershipNumber.trim()) {
      newErrors.membershipNumber = 'Membership number is required';
    }
    
    if (userType === 'licensed' && !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Navigate to form page with existing user data
    navigate('/form', {
      state: {
        existingUser: true,
        userType,
        userData: formData
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please select your user type and provide your details
            </p>
          </div>

          {!userType ? (
            // User Type Selection
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserTypeSelect('membership')}
                className="w-full p-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-lg">Membership</div>
                  <div className="text-sm opacity-90 mt-1">For existing members</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserTypeSelect('licensed')}
                className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📜</div>
                  <div className="text-lg">Licensed</div>
                  <div className="text-sm opacity-90 mt-1">For licensed ministers</div>
                </div>
              </motion.button>
            </div>
          ) : (
            // Form for selected user type
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {userType === 'membership' ? 'Membership Details' : 'License Details'}
                </h2>
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change Type
                </button>
              </div>

              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.fullName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Membership Number Field */}
              {userType === 'membership' && (
                <div>
                  <label htmlFor="membershipNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Membership Number *
                  </label>
                  <input
                    type="text"
                    id="membershipNumber"
                    name="membershipNumber"
                    value={formData.membershipNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.membershipNumber 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter your membership number"
                  />
                  {errors.membershipNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.membershipNumber}</p>
                  )}
                </div>
              )}

              {/* License Number Field */}
              {userType === 'licensed' && (
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMF License Number *
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.licenseNumber 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter your IMF license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Continue to Form
              </motion.button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ExistingUserForm;