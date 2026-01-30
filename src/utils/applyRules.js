import { 
    calculateProductBenefits, 
    findCardDiscounts,
    comboRules as staticComboRules,
    benefitRules,
    findBenefits
} from '../constants/discountRules';

// 조건이 만족하는지 확인하는 함수
const checkConditions = (conditions, selectedOptions) => {
    return Object.entries(conditions).every(([key, condition]) => {
        const selectedOption = selectedOptions[key];
        return selectedOption && selectedOption.label === condition.label;
    });
};

// 결합 할인만 처리하는 함수
export const applyComboRules = (selectedOptions, comboRules = staticComboRules, excludedKeys = []) => {
    // null 방어
    if (!comboRules) {
        comboRules = staticComboRules;
    }

    const result = {
        discounts: []
    };

    // 선택된 옵션이 없는 경우 early return
    if (!selectedOptions) {
        return result;
    }

    // 적용 가능한 모든 할인 찾기
    const applicableDiscounts = [];

    // 제외된 key 와 동일 카테고리(prefix) 도 전부 건너뛰도록 prefix 목록 생성
    const excludedCategories = excludedKeys.map(k => (k || '').split('_')[0]);

    // 각 할인 규칙 검사
    Object.entries(comboRules).forEach(([key, rule]) => {
        // key 자체 또는 카테고리(prefix)가 제외 되었는지 확인
        if (excludedKeys.includes(key) || excludedCategories.includes(key.split('_')[0])) {
            return; // skip this rule entirely
        }
        // 필수 서비스가 모두 선택되었는지 확인
        const hasAllRequired = rule.conditions.required.every(service => {
            if (service === 'highorder') {
                const highorderArr = Array.isArray(selectedOptions['highorder']) ? selectedOptions['highorder'] : [];
                return highorderArr.length > 0;
            }
            const selectedOption = selectedOptions[service];
            if (Array.isArray(selectedOption)) {
                return selectedOption.length > 0;
            }
            return selectedOption && selectedOption.label && selectedOption.label !== '선택 안함';
        });

        if (hasAllRequired) {
            // 옵션 조건이 맞는지 확인
            const optionsMatch = Object.entries(rule.conditions.options).every(([service, allowedOptions]) => {
                if (service === 'highorder') {
                    const highorderArr = Array.isArray(selectedOptions['highorder']) ? selectedOptions['highorder'] : [];
                    return highorderArr.some(item => allowedOptions.includes(item.label));
                }
                const selectedOption = selectedOptions[service];
                if (Array.isArray(selectedOption)) {
                    // POS 등 복수 선택: 하나라도 allowedOptions에 포함되면 true
                    return selectedOption.some(opt => opt.label && allowedOptions.includes(opt.label));
                }
                return selectedOption && selectedOption.label && allowedOptions.includes(selectedOption.label);
            });

            if (optionsMatch) {
                applicableDiscounts.push({
                    key,
                    ...rule
                });
            }
        }
    });

    // 할인이 없으면 종료
    if (applicableDiscounts.length === 0) {
        return result;
    }

    // 우선순위 순으로 정렬
    applicableDiscounts.sort((a, b) => a.priority - b.priority);

    // 적용할 할인들 선택
    const appliedDiscounts = [];
    const processedDiscounts = new Set();

    // 우선순위가 높은 할인부터 처리
    for (const discount of applicableDiscounts) {
        // 이미 처리된 할인이면 스킵
        if (processedDiscounts.has(discount.key)) {
            continue;
        }

        // 동일 카테고리(접두사) 할인은 동시에 적용하지 않음
        const sameCategoryExists = appliedDiscounts.some(
            (applied) => applied.key.split('_')[0] === discount.key.split('_')[0]
        );

        // canCombineWith 규칙:
        //   • 두 할인 모두 상대 key 를 배열에 포함해야 결합 허용
        //   • 어느 한쪽이라도 배열이 비어 있으면 결합 불가(독점 할인)
        const canCombine = !sameCategoryExists && appliedDiscounts.every((applied) => {
            const aList = applied.canCombineWith || [];
            const bList = discount.canCombineWith || [];

            if (aList.length === 0 || bList.length === 0) return false;

            return aList.includes(discount.key) && bList.includes(applied.key);
        });

        if (!canCombine) {
            continue;
        }

        // 현재 할인 추가
        appliedDiscounts.push(discount);
        processedDiscounts.add(discount.key);
    }

    // 결합할인만 처리 (monthlyDiscount > 1인 경우만)
    appliedDiscounts.forEach(discount => {
        if (discount.monthlyDiscount > 1) {
            result.discounts.push({
                key: discount.key,
                type: 'monthly',
                label: discount.title,
                amount: discount.monthlyDiscount
            });
        }
    });

    return result;
};

// 혜택 적용
export const applyBenefitRules = (selectedOptions) => {
    const benefits = [];
    
    // 상품별 혜택 계산
    const productBenefits = calculateProductBenefits(selectedOptions, benefitRules);
    if (productBenefits.length > 0) {
        benefits.push(...productBenefits);
    }

    return {
        benefits
    };
};

// 카드 할인 적용
export const applyCardDiscountRules = (selectedOptions) => {
    const cardDiscounts = findCardDiscounts(selectedOptions);
    if (!cardDiscounts) return null;

    return cardDiscounts.map(discount => ({
        type: 'card',
        label: discount.label,
        amount: discount.amount,
        description: `${discount.label} ${discount.amount.toLocaleString()}원`
    }));
};

// 전체 할인/혜택 적용
export const applyAllRules = (selectedOptions) => {
    // 1. 결합 할인 계산
    const comboDiscount = applyComboRules(selectedOptions);

    // 2. 혜택 계산
    const benefitResult = applyBenefitRules(selectedOptions);

    // 3. 카드 할인 계산
    const cardDiscounts = applyCardDiscountRules(selectedOptions);

    // 4. 지니원 혜택 계산
    const genieOneBenefits = findBenefits(selectedOptions);

    // 5. 할인/혜택 정보 구성
    const discountInfo = {
        monthly: comboDiscount.discounts,
        benefits: [...benefitResult.benefits, ...genieOneBenefits.benefits],
        card: cardDiscounts || [],
    };

    // 6. 총액 계산
    discountInfo.totalMonthlyDiscount = discountInfo.monthly.reduce((sum, d) => sum + d.amount, 0);
    discountInfo.totalCardDiscount = discountInfo.card.reduce((sum, d) => sum + d.amount, 0);
    discountInfo.totalBenefits = {
        giftCard: discountInfo.benefits.reduce((sum, b) => sum + (b.giftCard || 0), 0),
        cash: discountInfo.benefits.reduce((sum, b) => sum + (b.cash || 0), 0)
    };

    // 7. 가격 계산
    const originalTotal = calculateOriginalTotal(selectedOptions);
    const finalTotal = calculateFinalTotal(selectedOptions, discountInfo);

    return {
        discounts: discountInfo,
        originalTotal,
        finalTotal
    };
};

// 원래 가격 계산
const calculateOriginalTotal = (selectedOptions) => {
    return Object.entries(selectedOptions).reduce((total, [key, option]) => {
        if (option && option.label !== '선택 안함' && option.price) {
            return total + option.price;
        }
        return total;
    }, 0);
};

// 최종 가격 계산
const calculateFinalTotal = (selectedOptions, discountInfo) => {
    const originalTotal = calculateOriginalTotal(selectedOptions);
    const totalDiscount = discountInfo.totalMonthlyDiscount + discountInfo.totalCardDiscount;
    return Math.max(0, originalTotal - totalDiscount);
}; 