import QuoteCalculator from './QuoteCalculator.js';
import { calculateOriginalTotal, calculateDiscountTotal, calculateFinalTotal } from '../utils/calculate.js';

/**
 * Aggregate various calculation helpers and return full estimate summary.
 * Keeps pure domain logic (no React).
 */
export default class EstimateService {
  /**
   * @param {object} selectedOptions - user selections keyed by service key
   * @param {Array} services - services metadata list (required; fetched from API)
   * @param {boolean} isCardDiscountApplied - whether to apply card discount
   * @param {Array} productBenefitRows - product benefit rows for QuoteCalculator
   * @param {Array} comboRules - combo rules for QuoteCalculator
   * @param {Array} benefitRuleRows - benefit rule rows for QuoteCalculator
   * @param {object} context - additional context for QuoteCalculator
   */
  static calculate(selectedOptions = {}, services = [], isCardDiscountApplied = false, productBenefitRows = [], comboRules = [], benefitRuleRows = [], context = {}) {
    const calculator = new QuoteCalculator(services, productBenefitRows, comboRules, benefitRuleRows, undefined, context);
    const quoteResult = calculator.calculate(selectedOptions, context);

    const originalTotal = calculateOriginalTotal(services, selectedOptions);
    const discountTotal = calculateDiscountTotal(
      services,
      selectedOptions,
      isCardDiscountApplied,
      comboRules,
      context.excludedCombos || []
    );
    const finalTotal = calculateFinalTotal(originalTotal, discountTotal);

    return {
      originalTotal,
      discountTotal,
      finalTotal,
      ...quoteResult // productBenefits, extraBenefits, comboDiscount, cardDiscounts
    };
  }
} 