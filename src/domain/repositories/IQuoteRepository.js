/**
 * Interface for quote related data access.
 * SRP: 단가·혜택·할인 관련 도메인 데이터 조회/계산 책임을 정의한다.
 * 구현체는 JSON, MySQL 등 다양한 저장소를 지원할 수 있다.
 */
export default class IQuoteRepository {
  /**
   * @param {object} selectedOptions
   * @returns {{giftCard:number,cash:number,items:string[],productBenefits:Array}}
   */
  calculateProductBenefits(selectedOptions) {
    throw new Error('Not implemented');
  }

  /**
   * 추가 혜택 규칙 적용 결과
   * @param {object} selectedOptions
   */
  findBenefits(selectedOptions) {
    throw new Error('Not implemented');
  }

  /**
   * 결합 할인 규칙 결과
   * @param {object} selectedOptions
   */
  findComboDiscount(selectedOptions) {
    throw new Error('Not implemented');
  }

  /**
   * 카드 할인 결과
   * @param {object} selectedOptions
   */
  findCardDiscounts(selectedOptions) {
    throw new Error('Not implemented');
  }
} 