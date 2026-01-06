import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CurrencyConverter from '../components/CurrencyConverter';

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
    color: 'from-green-400 to-blue-500',
  },
  {
    name: 'Renewal Only',
    // Original: ₦75,000 + ₦25,000 = ₦100,000 -> ~$67
    price: '$67',
    amount: 67,
    description: 'Renewal for existing ministers.',
    features: ['Administrative Fee', 'Renewal Fee'],
    color: 'from-blue-500 to-purple-500',
  },
  {
    name: 'Membership and Licensing',
    // Original: ₦125,000 + ₦25,000 = ₦150,000 -> ~$100
    price: '$100',
    amount: 100,
    description: 'Full membership with licensing credentials.',
    features: ['Administrative Fee', 'Licensing Fee', 'Membership Fee'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Membership, Licensing and Ordination',
    // Original: ₦175,000 + ₦25,000 = ₦200,000 -> ~$133
    price: '$133',
    amount: 133,
    description: 'Complete credentials package for senior ministers.',
    features: ['Administrative Fee', 'Licensing Fee', 'Membership Fee', 'Ordination Fee'],
    color: 'from-pink-500 to-red-500',
  },
  {
    name: 'Membership and Ordination',
    // Original: ₦125,000 + ₦25,000 = ₦150,000 -> ~$100
    price: '$100',
    amount: 100,
    description: 'Advanced credentials for experienced ministers.',
    features: ['Administrative Fee', 'Membership Fee', 'Ordination Fee'],
    color: 'from-red-500 to-yellow-500',
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mb-12">
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

      {/* Currency Converter Section */}
      <div className="w-full max-w-4xl mx-auto mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            💰 Currency Conversion
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            See how our USD prices convert to your local currency
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {plans.slice(0, 3).map((plan) => (
            <CurrencyConverter key={plan.name} usdAmount={plan.amount} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.slice(3).map((plan) => (
            <CurrencyConverter key={plan.name} usdAmount={plan.amount} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;