import { useMemo } from 'react';
import QuoteCalculator from '../domain/QuoteCalculator.js';

export default function useQuoteCalculator(selectedOptions) {
  const calculator = useMemo(() => new QuoteCalculator([], []), []);
 
  return useMemo(() => {
    return calculator.calculate(selectedOptions);
  }, [calculator, selectedOptions]);
} 