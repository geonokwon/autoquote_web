import QuoteCalculator from '../QuoteCalculator.js';

// Mock a minimal selectedOptions object
const selectedOptionsSample = {
  internet: { label: '100M' }
};

describe('QuoteCalculator', () => {
  it('calculates benefits for internet 100M', () => {
    const calculator = new QuoteCalculator();
    const result = calculator.calculate(selectedOptionsSample);

    // Internet 100M expected gift card 40000, cash 50000 (from discountRules productBenefits)
    expect(result.productBenefits.giftCard).toBe(40000);
    expect(result.productBenefits.cash).toBe(50000);
  });
}); 