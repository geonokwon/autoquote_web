import EstimateService from '../EstimateService.js';

// Mock minimal services list for predictable pricing
const servicesMock = [
  { key: 'internet', name: '인터넷', isDiscount: false, isCardDiscount: false },
  { key: 'manual_discount', name: '직접할인', isDiscount: true }
];

describe('EstimateService.calculate', () => {
  it('computes originalTotal and finalTotal without discounts', () => {
    const selectedOptions = {
      internet: { label: '직접입력', price: 30000 }
    };

    const result = EstimateService.calculate(selectedOptions, servicesMock, false, [], [], [], {});
    expect(result.originalTotal).toBe(30000);
    expect(result.finalTotal).toBe(30000);
  });

  it('applies manual discount correctly', () => {
    const selectedOptions = {
      internet: { label: '직접입력', price: 30000 },
      manual_discount: [{ label: '할인', price: -5000 }]
    };
    const result = EstimateService.calculate(selectedOptions, servicesMock, false, [], [], [], {});

    expect(result.originalTotal).toBe(30000);
    expect(result.discountTotal).toBe(-5000);
    expect(result.finalTotal).toBe(25000);
  });
}); 