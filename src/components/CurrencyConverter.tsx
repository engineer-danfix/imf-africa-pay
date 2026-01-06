import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  flag: string;
}

const CurrencyConverter: React.FC<{ usdAmount: number }> = ({ usdAmount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popular currencies with their country codes and flags
  const popularCurrencies: CurrencyRate[] = [
    { code: 'NGN', name: 'Nigerian Naira', rate: 0, flag: '🇳🇬' },
    { code: 'GBP', name: 'British Pound', rate: 0, flag: '🇬🇧' },
    { code: 'EUR', name: 'Euro', rate: 0, flag: '🇪🇺' },
    { code: 'CAD', name: 'Canadian Dollar', rate: 0, flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', rate: 0, flag: '🇦🇺' },
    { code: 'ZAR', name: 'South African Rand', rate: 0, flag: '🇿🇦' },
    { code: 'KES', name: 'Kenyan Shilling', rate: 0, flag: '🇰🇪' },
    { code: 'GHS', name: 'Ghanaian Cedi', rate: 0, flag: '🇬🇭' },
    { code: 'UGX', name: 'Ugandan Shilling', rate: 0, flag: '🇺🇬' },
    { code: 'TZS', name: 'Tanzanian Shilling', rate: 0, flag: '🇹🇿' },
  ];

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using exchangerate-api.com (free tier allows 1500 requests/month)
        // You'll need to get a free API key from https://exchangerate-api.com
        const response = await fetch(
          'https://api.exchangerate-api.com/v4/latest/USD'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        
        const data = await response.json();
        const updatedRates = popularCurrencies.map(currency => ({
          ...currency,
          rate: data.rates[currency.code] || 0
        }));
        
        setRates(updatedRates);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Unable to fetch current exchange rates. Showing cached data.');
        
        // Fallback rates (approximate as of 2024)
        const fallbackRates: CurrencyRate[] = [
          { code: 'NGN', name: 'Nigerian Naira', rate: 1500, flag: '🇳🇬' },
          { code: 'GBP', name: 'British Pound', rate: 0.80, flag: '🇬🇧' },
          { code: 'EUR', name: 'Euro', rate: 0.92, flag: '🇪🇺' },
          { code: 'CAD', name: 'Canadian Dollar', rate: 1.35, flag: '🇨🇦' },
          { code: 'AUD', name: 'Australian Dollar', rate: 1.50, flag: '🇦🇺' },
          { code: 'ZAR', name: 'South African Rand', rate: 18.50, flag: '🇿🇦' },
          { code: 'KES', name: 'Kenyan Shilling', rate: 130, flag: '🇰🇪' },
          { code: 'GHS', name: 'Ghanaian Cedi', rate: 12.50, flag: '🇬🇭' },
          { code: 'UGX', name: 'Ugandan Shilling', rate: 3700, flag: '🇺🇬' },
          { code: 'TZS', name: 'Tanzanian Shilling', rate: 2500, flag: '🇹🇿' },
        ];
        setRates(fallbackRates);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  const toggleConverter = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleConverter}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
      >
        <span>💱 Convert to Local Currency</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
            Currency Conversion
          </h3>
          
          {error && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🇺🇸</span>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">US Dollar</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">USD</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-blue-700 dark:text-blue-400">
                  ${usdAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              rates.map((currency) => (
                <div 
                  key={currency.code}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{currency.flag}</span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">{currency.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{currency.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800 dark:text-white">
                      {currency.rate > 0 
                        ? `${currency.code === 'NGN' ? '₦' : currency.code === 'EUR' ? '€' : currency.code === 'GBP' ? '£' : ''}${(usdAmount * currency.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      1 USD = {currency.rate.toFixed(2)} {currency.code}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Exchange rates update in real-time. Rates may vary slightly from actual bank rates.
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CurrencyConverter;