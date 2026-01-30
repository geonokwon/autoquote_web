import QuoteJsonRepository from '../infrastructure/repositories/json/QuoteJsonRepository.js';

/**
 * QuoteCalculator: 계산 로직을 수행하는 도메인 서비스
 * 의존성 주입을 통해 Repository 구현체를 교환 가능(DIP)
 */
export default class QuoteCalculator {
  constructor(services = [], productBenefitRows = [], comboRules = [], benefitRuleRows = [], repository, context = {}) {
    this.repository =
      repository || new QuoteJsonRepository(services, productBenefitRows, comboRules, benefitRuleRows, context);
  }

  /**
   * @param {object} selectedOptions
   */
  calculate(selectedOptions, context = {}) {
    if (!selectedOptions) {
      return this._emptyResult();
    }

    // 기존 레거시에서 배열 서비스를 첫 요소만 사용했지만, 이제는 meta.multiSelect 로 분기하므로 전체 배열을 전달.
    const optsForCalc = { ...selectedOptions };

    const productBenefits = this.repository.calculateProductBenefits(optsForCalc);
    const extraBenefits = this.repository.findBenefits(optsForCalc);
    const comboDiscount = this.repository.findComboDiscount(optsForCalc);
    const cardDiscounts = this.repository.findCardDiscounts(optsForCalc);

    return {
      productBenefits,
      extraBenefits,
      comboDiscount,
      cardDiscounts
    };
  }

  _emptyResult() {
    return {
      productBenefits: {
        giftCard: 0,
        cash: 0,
        items: [],
        productBenefits: []
      },
      extraBenefits: {
        giftCard: 0,
        cash: 0,
        productBenefits: []
      },
      comboDiscount: null,
      cardDiscounts: null
    };
  }
} 