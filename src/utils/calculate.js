import { applyComboRules } from './applyRules.js';

export const calculateOriginalTotal = (services, selectedOptions) => {
    const highorderArr = Array.isArray(selectedOptions['highorder']) ? selectedOptions['highorder'] : [];

    return services
        .filter(service => !service.isDiscount && !service.isCardDiscount)
        .reduce((sum, service) => {
            // generic handling for multi-select array options
            const optVal = selectedOptions[service.key];

            if (Array.isArray(optVal)) {
                return sum + optVal.reduce((acc,item)=> acc + (item.price || 0), 0);
            }

            if (service.key === 'highorder') {
                return sum + highorderArr.reduce((acc, item) => acc + (item.price || 0), 0);
            }

            return sum + ((optVal && optVal.price) || 0);
        }, 0);
};

export const calculateDiscountTotal = (
    services,
    selectedOptions,
    isCardDiscountApplied = false,
    comboRules = [],
    excludedCombos = []
) => {
    if (!selectedOptions) return 0;

    // 1. 선택된 옵션들 중 가격이 음수인 항목(모든 할인)을 집계
    const flattenOptions = (obj) => {
        const list = [];
        Object.values(obj).forEach((val) => {
            if (Array.isArray(val)) {
                val.forEach((v) => list.push(v));
            } else if (val && typeof val === 'object') {
                list.push(val);
            }
        });
        return list;
    };

    const optionList = flattenOptions(selectedOptions);

    // 모든 음수 가격의 절댓값 합산 (직접할인·자동 추가 할인·카드 할인 모두 포함)
    const negativeDiscountTotal = optionList
        .filter((o) => typeof o.price === 'number' && o.price < 0)
        .reduce((sum, o) => sum + Math.abs(o.price), 0);

    // 2. 결합 할인 추가 (모두 합산).
    //    동일 금액 할인 여러 개가 있을 수 있으므로 단순 금액 중복으로 제외하지 않는다.
    //    단, 정확히 같은 할인(동일 key)이 음수 옵션으로 이미 들어가 있었다면 중복을 방지해야 하지만
    //    현재 음수 옵션에는 결합할인 key 정보가 없으므로, 실제 중복 위험이 거의 없어 전체 합산한다.

    const extraComboDiscount = applyComboRules(selectedOptions, comboRules, excludedCombos).discounts
        .reduce((sum, d) => sum + d.amount, 0);

    // 3. 카드 할인 서비스는 옵션에 양수로 저장돼 있으므로 (isCardDiscount),
    //    카드 할인 적용 여부에 따라 제외
    const cardDiscountTotal = isCardDiscountApplied
        ? services
            .filter((svc) => svc.isCardDiscount)
            .reduce((sum, svc) => {
                const opt = selectedOptions[svc.key];
                if (opt && typeof opt.price === 'number' && opt.price > 0) {
                    return sum + opt.price;
                }
                return sum;
            }, 0)
        : 0;

    // 최종 할인 금액 (음수, 절대값은 할인 총액)
    return -(negativeDiscountTotal + extraComboDiscount + cardDiscountTotal);
};

export const calculateFinalTotal = (originalTotal, discountTotal) => {
    return originalTotal - Math.abs(discountTotal);
}; 