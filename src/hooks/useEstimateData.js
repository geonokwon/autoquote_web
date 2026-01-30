import { useMemo } from 'react';
import EstimateService from '../domain/EstimateService.js';

/**
 * React hook wrapper around EstimateService.calculate
 * @param {object} selectedOptions
 * @param {boolean} isCardDiscountApplied
 * @param {array} productBenefitRows
 * @param {array} comboRules
 * @param {array} benefitRuleRows
 * @param {object} context
 * @returns {object} estimate summary (originalTotal, discountTotal, finalTotal, productBenefits, extraBenefits, comboDiscount, cardDiscounts)
 */
export default function useEstimateData(
  selectedOptions,
  services = [],
  isCardDiscountApplied = false,
  productBenefitRows = [],
  comboRules = [],
  benefitRuleRows = [],
  context = {}
) {
  return useMemo(() => {
    return EstimateService.calculate(selectedOptions, services, isCardDiscountApplied, productBenefitRows, comboRules, benefitRuleRows, context);
  }, [selectedOptions, services, isCardDiscountApplied, productBenefitRows, comboRules, benefitRuleRows, context]);

  
} 