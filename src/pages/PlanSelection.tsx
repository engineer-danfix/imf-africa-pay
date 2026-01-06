import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';


// Updated pricing: Original Naira amounts converted to USD using approximate exchange rate
// Using $1 = ₦1500 exchange rate (this is an approximation - actual rates fluctuate)
const plans = [
  {
    name: 'Membership Only',
    // Original: ₦75,000 + ₦25,000 = ₦100,000 -> ~$67
    price: '$67',
    amount: 67,
    description: 'Entry-level licensing for new ministers.',
    features: ['Administrative Fee', 'Membership Fee'],
    color: 'from-blue-500 to-blue-700',
  },
  {
    name: 'Renewal Only',
    // Original: ₦75,000 + ₦25,000 = ₦100,000 -> ~$67
    price: '$67',
    amount: 67,
    description: 'Renewal for existing ministers.',
    features: ['Administrative Fee', 'Renewal Fee'],
    color: 'from-blue-600 to-blue-800',
  },
  {
    name: 'Membership and Licensing',
    // Original: ₦125,000 + ₦25,000 = ₦150,000 -> ~$100
    price: '$100',
    amount: 100,
    description: 'Full membership with licensing credentials.',
    features: ['Administrative Fee', 'Licensing Fee', 'Membership Fee'],
    color: 'from-blue-700 to-blue-900',
  },
  {
    name: 'Membership, Licensing and Ordination',
    // Original: ₦175,000 + ₦25,000 = ₦200,000 -> ~$133
    price: '$133',
    amount: 133,
    description: 'Complete credentials package for senior ministers.',
    features: ['Administrative Fee', 'Licensing Fee', 'Membership Fee', 'Ordination Fee'],
    color: 'from-blue-800 to-blue-950',
  },
  {
    name: 'Membership and Ordination',
    // Original: ₦125,000 + ₦25,000 = ₦150,000 -> ~$100
    price: '$100',
    amount: 100,
    description: 'Advanced credentials for experienced ministers.',
    features: ['Administrative Fee', 'Membership Fee', 'Ordination Fee'],
    color: 'from-blue-900 to-blue-950',
  },
];

// Simplified animation variants for better performance
const cardVariants = {
  offscreen: { opacity: 0, y: 20 },
  onscreen: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const PlanSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (plan: typeof plans[0]) => {
    navigate('/bank-details', { state: { plan } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold mb-4 text-gray-800 dark:text-white">
          IMF Licensing & Ordination Portal
        </h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Select the plan that best fits your ministry journey. All plans include official IMF certification and support.
        </p>
        
        {/* Existing User Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 dark:bg-gray-700 rounded-xl p-4 mb-8 max-w-lg mx-auto"
        >
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            <span className="font-semibold">Already made a payment?</span> Click below to access your existing account.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/existing-user')}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow hover:shadow-lg transition-all"
          >
            I've Made Payment Before
          </motion.button>
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            className={`rounded-2xl shadow-xl bg-gradient-to-br ${plan.color} p-1`}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{plan.name}</h2>
              <div className="text-2xl font-extrabold mb-2 text-blue-700 dark:text-blue-400">{plan.price}</div>
              
              {/* Currency Converter for this card */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Local Currency:</label>
                </div>
                <select 
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const currencyCode = e.target.value;
                    if (currencyCode) {
                      // In a real implementation, we would fetch exchange rates here
                      // For now, we'll use placeholder values
                      const rates: Record<string, number> = {
                        'NGN': 1500,
                        'GHS': 14.5,
                        'KES': 130,
                        'ZAR': 18.5,
                        'UGX': 3700,
                        'TZS': 2500,
                        'GBP': 0.8,
                        'EUR': 0.92,
                        'CAD': 1.35,
                        'AUD': 1.5,
                        'USD': 1
                      };
                      
                      const rate = rates[currencyCode] || 1;
                      const convertedAmount = plan.amount * rate;
                      
                      // Update the display temporarily
                      const card = e.target.closest('.rounded-2xl');
                      if (card) {
                        const currencyDisplay = card.querySelector('.currency-display');
                        if (currencyDisplay) {
                          const currencySymbols: Record<string, string> = {
                            'NGN': '₦',
                            'GHS': 'GH₵',
                            'KES': 'KSh',
                            'ZAR': 'R',
                            'UGX': 'USh',
                            'TZS': 'TSh',
                            'GBP': '£',
                            'EUR': '€',
                            'CAD': 'C$',
                            'AUD': 'A$',
                            'USD': '$'
                          };
                          
                          const symbol = currencySymbols[currencyCode] || currencyCode;
                          currencyDisplay.textContent = `${symbol}${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                        }
                      }
                    }
                  }}
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD ($)</option>
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="GHS">Ghanaian Cedi (GH₵)</option>
                  <option value="KES">Kenyan Shilling (KSh)</option>
                  <option value="ZAR">South African Rand (R)</option>
                  <option value="UGX">Ugandan Shilling (USh)</option>
                  <option value="TZS">Tanzanian Shilling (TSh)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="CAD">Canadian Dollar (C$)</option>
                  <option value="AUD">Australian Dollar (A$)</option>
                </select>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="currency-display"></span>
                </div>
              </div>
              
              <p className="mb-4 text-gray-600 dark:text-gray-300 text-sm">{plan.description}</p>
              <ul className="mb-6 text-left text-gray-500 dark:text-gray-400 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center mb-1">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all text-sm"
                onClick={() => handleSelect(plan)}
              >
                Select Plan
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlanSelection;