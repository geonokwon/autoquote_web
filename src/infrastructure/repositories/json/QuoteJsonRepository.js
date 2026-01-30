import IQuoteRepository from '../../../domain/repositories/IQuoteRepository.js';
import {
  findBenefits,
  findComboDiscount,
  findCardDiscounts
} from '../../../constants/discountRules.js';

import { calculateProductBenefits as calculateProductBenefitsStatic } from '../../../constants/discountRules.js';
import { applyComboRules } from '../../../utils/applyRules.js';

/**
 * In-memory implementation backed by existing JS constant modules.
 */
export default class QuoteJsonRepository extends IQuoteRepository {
  constructor(services = [], productBenefitRows = [], comboRules = [], benefitRuleRows = [], context = {}) {
    super();
    this.services = services || [];
    this.productBenefitRows = productBenefitRows;
    this.comboRules = comboRules;
    this.benefitRuleRows = benefitRuleRows;
    this.context = context;
  }

  _rowsToMap() {
    const map = {};
    this.productBenefitRows.forEach((row) => {
      if (!map[row.serviceKey]) {
        const svcName = this.services.find((s) => s.key === row.serviceKey)?.name || row.serviceKey;
        map[row.serviceKey] = { title: svcName };
      }
      map[row.serviceKey][row.option] = {
        giftCard: row.giftCard || 0,
        cash: row.cash || 0,
        multiplyByQuantity: row.multiplyByQuantity !== false,
        ...(row.perQuantity ? { perQuantity: row.perQuantity } : {}),
        excludeGiftCardIfBusiness: !!row.excludeGiftCardIfBusiness,
        excludeCashIfBusiness: !!row.excludeCashIfBusiness,
        excludeGiftCardIfOfficeInternet: !!row.excludeGiftCardIfOfficeInternet,
        excludeCashIfOfficeInternet: !!row.excludeCashIfOfficeInternet
      };
    });
    return map;
  }

  _benefitRowsToObj() {
    const obj = {};
    (this.benefitRuleRows || []).forEach((r) => {
      if (!r.key) return;
      obj[r.key] = {
        title: r.title,
        giftCard: r.giftCard || 0,
        cash: r.cash || 0,
        canCombineWith: r.canCombineWith || [],
        priority: r.priority || 0,
        conditions: r.conditions || { required: [], options: {} }
      };
    });
    return obj;
  }

  calculateProductBenefits(selectedOptions) {
    if (this.productBenefitRows?.length) {
      const dynamicMap = this._rowsToMap();
      return calculateProductBenefitsStatic(selectedOptions, dynamicMap, this.context);
    }
    return calculateProductBenefitsStatic(selectedOptions, null, this.context);
  }

  findBenefits(selectedOptions) {
    if (this.benefitRuleRows && this.benefitRuleRows.length) {
      const dynamicObj = this._benefitRowsToObj();
      return findBenefitsDynamic(selectedOptions, dynamicObj);
    }
    return findBenefits(selectedOptions);
  }

  findComboDiscount(selectedOptions) {
    const combo = applyComboRules(selectedOptions, this.comboRules || [], this.context.excludedCombos || []);
    if (!combo.discounts || combo.discounts.length === 0) {
      return null;
    }

    const totalMonthly = combo.discounts.reduce((sum, d) => sum + d.amount, 0);
    const items = combo.discounts.map((d) => `${d.label} ${d.amount.toLocaleString()}원`);

    return {
      monthlyDiscount: totalMonthly,
      benefits: {
        title: '결합 할인',
        giftCard: 0,
        cash: 0,
        items
      }
    };
  }

  findCardDiscounts(selectedOptions) {
    return findCardDiscounts(selectedOptions);
  }
}

// Dynamic benefit calculation from rule object
function findBenefitsDynamic(selectedOptions, rulesObj) {
  const result = { giftCard: 0, cash: 0, productBenefits: [] };
  if (!selectedOptions || !rulesObj) return result;

  const applicable = [];
  Object.entries(rulesObj).forEach(([key, rule]) => {
    const hasAll = rule.conditions.required.every((svc) => {
      const sel = selectedOptions[svc];
      if (Array.isArray(sel)) return sel.length > 0;
      return sel && sel.label && sel.label !== '선택 안함';
    });
    if (!hasAll) return;

    // 옵션 매칭: 정확 일치 OR 포함(카테고리 매칭) 둘 다 허용
    const labelMatches = (label, allowedArr) => {
      return allowedArr.some((a) => a === label || label.includes(a) || a.includes(label));
    };

    const optMatch = Object.entries(rule.conditions.options || {}).every(([svc, allowed]) => {
      const sel = selectedOptions[svc];
      if (Array.isArray(sel)) {
        return sel.some((o) => labelMatches(o.label, allowed));
      }
      return sel && labelMatches(sel.label, allowed);
    });
    if (!optMatch) return;
    applicable.push({ key, ...rule });
  });

  // Resolve conflicts using canCombineWith & priority
  const processed = new Set();
  // sort by priority(desc), then gift+cash(desc)
  const sorted = applicable.sort((a,b)=>{
    const pa = b.priority || 0;
    const pb = a.priority || 0;
    if(pa!==pb) return pa-pb;
    const aa=(a.giftCard||0)+(a.cash||0);
    const bb=(b.giftCard||0)+(b.cash||0);
    return bb-aa;
  });

  sorted.forEach(rule=>{
    if(processed.has(rule.key)) return;
    // default: duplicate allowed (empty array or undefined)
    const combineList = Array.isArray(rule.canCombineWith)? rule.canCombineWith: [];
    const clash = combineList.some(k=> processed.has(k));
    if(clash){
      return; // skip if conflicting rule already applied
    }
    // apply rule
    result.giftCard += rule.giftCard || 0;
    result.cash += rule.cash || 0;
    if ((rule.giftCard||0)+(rule.cash||0)>0){
      result.productBenefits.push({ key: rule.key, title: rule.title, service:'benefit', giftCard: rule.giftCard||0, cash: rule.cash||0 });
    }
    processed.add(rule.key);
  });

  return result;
}
 