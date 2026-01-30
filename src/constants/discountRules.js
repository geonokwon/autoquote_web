// All static data moved to DB (single-source). Keep empty placeholders for legacy helper functions.
export const productBenefits = {};
export const benefitRules = {};
export const comboRules = {};
export const cardDiscounts = {};
export const servicesPlaceholder = [];

// 서비스 이름은 DB에서 가져온 services 배열로 동적으로 해석한다.
let _servicesList = [];

export const setServicesList = (list) => {
  _servicesList = Array.isArray(list) ? list : [];
};

const getServiceName = (key) => {
  return _servicesList.find((s) => s.key === key)?.name || key;
};

// ---- original algorithms below remain unchanged ----

// 수량별(perQuantity) 혜택 계산 헬퍼
// 1) 정확히 일치하는 수량이 있으면 그 값을 사용
// 2) 없으면 정의된 수량 중 qty 이하에서 가장 큰 값을 사용 (예: 5대 요청 & 1~4대만 정의 → 4대 혜택 적용)
// 3) perQuantity 자체가 없으면 기본(giftCard/cash) * qty 로 계산
const computeBenefit = (svcBenefits, qty) => {
    if (!svcBenefits) return { giftCard: 0, cash: 0 };

    if (svcBenefits.perQuantity) {
        const tbl = svcBenefits.perQuantity;
        // perQuantity 키가 '6', '6대' 등 숫자+문자 형태일 수 있으므로
        // (1) 모든 항목을 [numKey, originalKey, value] 형태로 변환
        const entries = Object.entries(tbl)
            .map(([k, v]) => ({ num: parseInt(k, 10), key: k, val: v }))
            .filter(e => !isNaN(e.num));

        if (entries.length) {
            // (2) 정확히 일치하는 수량 우선
            const exact = entries.find(e => e.num === qty);
            if (exact) {
                return {
                    giftCard: exact.val.giftCard || 0,
                    cash: exact.val.cash || 0
                };
            }

            // (3) qty 이하 중 가장 큰 수량
            const candidates = entries.filter(e => e.num <= qty);
            if (candidates.length) {
                const best = candidates.reduce((prev, cur) => (cur.num > prev.num ? cur : prev), candidates[0]);
                return {
                    giftCard: best.val.giftCard || 0,
                    cash: best.val.cash || 0
                };
            }
        }
    }
    // fallback: multiplyByQuantity 가 false 이면 수량 무시하고 1회 지급
    const shouldMultiply = svcBenefits.multiplyByQuantity !== false; // 기본값 true
    const factor = shouldMultiply ? qty : 1;
    return {
        giftCard: (svcBenefits.giftCard || 0) * factor,
        cash: (svcBenefits.cash || 0) * factor
    };
    };

    // 선택된 옵션의 기본 혜택 계산
export const calculateProductBenefits = (selectedOptions = {}, customMap = null, context = {}) => {
    const { isBusiness = false } = context;
        const multiHighorder = Array.isArray(selectedOptions.highorder) ? selectedOptions.highorder : [];
        let benefits = {
            giftCard: 0,
            cash: 0,
            items: [],
            productBenefits: []  // 각 상품별 혜택을 저장할 배열
        };

    // 오피스/패밀리 인터넷 여부 (giftCard 제외 조건용)
        const isOfficeInternet = selectedOptions.internet && (
        selectedOptions.internet.label?.includes('패밀리') || selectedOptions.internet.label?.includes('오피스')
        );

        // 일반 서비스 혜택 처리
        Object.entries(selectedOptions).forEach(([serviceKey, option]) => {
            if (serviceKey !== 'highorder' && option && option.label !== '선택 안함' && option.label !== '직접입력') {
                if (Array.isArray(option)) {
                    option.forEach(opt => {
                        if (!opt || opt.label === '선택 안함' || opt.label === '직접입력') return;
                        const mapRef = customMap || productBenefits;
                        const serviceBenefits = mapRef[serviceKey]?.[opt.label];
                        if (serviceBenefits) {
                        const qty = opt.quantity || 1;
                        const { giftCard: g, cash: c } = computeBenefit(serviceBenefits, qty);
                        let giftCard = g;
                        let cash = c;

                        // 행(exclusion flags) 적용
                        if (isBusiness && serviceBenefits.excludeGiftCardIfBusiness) giftCard = 0;
                        if (isBusiness && serviceBenefits.excludeCashIfBusiness) cash = 0;
                        if (isOfficeInternet && serviceBenefits.excludeGiftCardIfOfficeInternet) giftCard = 0;
                        if (isOfficeInternet && serviceBenefits.excludeCashIfOfficeInternet) cash = 0;

                            benefits.giftCard += giftCard;
                            benefits.cash += cash;
                            if (giftCard > 0 || cash > 0) {
                                benefits.productBenefits.push({
                                title: (mapRef[serviceKey]?.title) || getServiceName(serviceKey),
                                    label: opt.label, // 추가!
                                    service: serviceKey,
                                    giftCard: giftCard,
                                    cash: cash
                                });
                                if (giftCard > 0) {
                                benefits.items.push(`${getServiceName(serviceKey)} 상품권 ${giftCard.toLocaleString()}원`);
                                }
                                if (cash > 0) {
                                benefits.items.push(`${getServiceName(serviceKey)} 현금사은품 ${cash.toLocaleString()}원`);
                                }
                            }
                        }
                    });
                } else {
                    const mapRef = customMap || productBenefits;
                    const serviceBenefits = mapRef[serviceKey]?.[option.label];
                    if (serviceBenefits) {
                    const qty = option.quantity || 1;
                    const { giftCard: g2, cash: c2 } = computeBenefit(serviceBenefits, qty);
                    let giftCard = g2;
                    let cash = c2;

                    // 행(exclusion flags) 적용
                    if (isBusiness && serviceBenefits.excludeGiftCardIfBusiness) giftCard = 0;
                    if (isBusiness && serviceBenefits.excludeCashIfBusiness) cash = 0;
                    if (isOfficeInternet && serviceBenefits.excludeGiftCardIfOfficeInternet) giftCard = 0;
                    if (isOfficeInternet && serviceBenefits.excludeCashIfOfficeInternet) cash = 0;

                        benefits.giftCard += giftCard;
                        benefits.cash += cash;
                        if (giftCard > 0 || cash > 0) {
                            benefits.productBenefits.push({
                            title: (mapRef[serviceKey]?.title) || getServiceName(serviceKey),
                                // label: option.label, // 추가!
                                service: serviceKey,
                                giftCard: giftCard,
                                cash: cash
                            });
                            if (giftCard > 0) {
                            benefits.items.push(`${getServiceName(serviceKey)} 상품권 ${giftCard.toLocaleString()}원`);
                            }
                            if (cash > 0) {
                            benefits.items.push(`${getServiceName(serviceKey)} 현금사은품 ${cash.toLocaleString()}원`);
                            }
                        }
                    }
                }
            }
        });

        // 하이오더 혜택 처리
        if (multiHighorder.length > 0) {
            const processedLabels = new Set(); // 이미 처리된 라벨을 추적

            multiHighorder.forEach(item => {
                // 이미 처리된 라벨은 건너뛰기
                if (processedLabels.has(item.label)) {
                    return;
                }

                const mapRef = customMap || productBenefits;
                const serviceBenefits = mapRef['highorder']?.[item.label];
                if (serviceBenefits) {
                    // 같은 라벨을 가진 모든 아이템의 수량 합산
                    const totalQuantity = multiHighorder
                        .filter(option => option.label === item.label)
                        .reduce((sum, option) => sum + (option.quantity || 1), 0);

                // 수량별(perQuantity) 혜택 테이블 지원
                const { giftCard: giftCardCalc, cash: cashCalc } = computeBenefit(serviceBenefits, totalQuantity);
                let giftCard = giftCardCalc;
                let cash = cashCalc;
                    
                    benefits.giftCard += giftCard;
                    benefits.cash += cash;
                    
                    if (giftCard > 0 || cash > 0) {
                        const quantityText = totalQuantity > 1 ? ` (x${totalQuantity})` : '';
                        // 하이픈 처리: 하이픈이 있으면 앞부분만 사용, 없으면 괄호 앞부분만 사용
                        let baseLabel = item.label;
                        
                        if (baseLabel.includes('-')) {
                            baseLabel = baseLabel.split('-')[0].trim();
                        }
                        
                        // 혜택 push: 알림판(10/15인치) cash가 0이면 push하지 않음
                        if ((giftCard > 0 || cash > 0) && !(baseLabel.startsWith('알림판') && cash === 0)) {
                            benefits.productBenefits.push({
                                title: baseLabel,
                                service: 'highorder',
                                label: `${baseLabel}${quantityText}`,
                                giftCard: giftCard,
                                cash: cash
                            });

                            if (giftCard > 0) {
                                benefits.items.push(`${baseLabel}${quantityText} 상품권 ${giftCard.toLocaleString()}원`);
                            }
                            if (cash > 0) {
                                benefits.items.push(`${baseLabel}${quantityText} 현금사은품 ${cash.toLocaleString()}원`);
                            }
                        }
                    }

                    // 처리된 라벨 기록
                    processedLabels.add(item.label);
                }
            });
        }

        // 추가 혜택 처리 (단일 또는 배열)
        const extraSel = selectedOptions.extraBenefit;
        if (extraSel) {
            const arr = Array.isArray(extraSel) ? extraSel : [extraSel];
            arr.forEach((opt)=>{
                const extraBenefits = opt.benefits || {};
            const giftCard = extraBenefits.giftCard || 0;
            const cash = extraBenefits.cash || 0;
            benefits.giftCard += giftCard;
            benefits.cash += cash;
                if (giftCard>0 || cash>0){
                benefits.productBenefits.push({
                        title: opt.label || '추가 혜택',
                    service: 'extraBenefit',
                        giftCard,
                        cash
                });
                    if(giftCard>0) benefits.items.push(`${opt.label||'추가 혜택'} 상품권 ${giftCard.toLocaleString()}원`);
                    if(cash>0) benefits.items.push(`${opt.label||'추가 혜택'} 현금사은품 ${cash.toLocaleString()}원`);
                }
            });
        }

        // 소상공인 혜택 별도 처리
        if (selectedOptions.smallBusinessBenefit && selectedOptions.smallBusinessBenefit.label === '소상공인 혜택') {
            const benefit = selectedOptions.smallBusinessBenefit.benefits;
            if (benefit) {
                benefits.giftCard += benefit.giftCard || 0;
                benefits.cash += benefit.cash || 0;
                benefits.productBenefits.push({
                    title: '지니원혜택',
                    service: 'smallBusinessBenefit',
                    giftCard: benefit.giftCard || 0,
                    cash: benefit.cash || 0
                });
                if (benefit.giftCard > 0) {
                    benefits.items.push(`소상공인 혜택 상품권 ${benefit.giftCard.toLocaleString()}원`);
                }
                if (benefit.cash > 0) {
                    benefits.items.push(`소상공인 혜택 현금사은품 ${benefit.cash.toLocaleString()}원`);
                }
            }
        }

        return benefits;
    };

    // 혜택 찾기 함수
    export const findBenefits = (selectedOptions) => {
        const result = {
            giftCard: 0,
            cash: 0,
            productBenefits: []
        };

        if (!selectedOptions) {
            return result;
        }

        // 적용 가능한 모든 혜택 찾기
        const applicableBenefits = [];

        // 각 혜택 규칙 검사
        Object.entries(benefitRules).forEach(([key, rule]) => {
            // 필수 서비스가 모두 선택되었는지 확인
            const hasAllRequired = rule.conditions.required.every(service => {
                const selectedOption = selectedOptions[service];
                if (Array.isArray(selectedOption)) {
                    // POS 등 복수 선택: 하나라도 있으면 true
                    return selectedOption.length > 0;
                }
                return selectedOption && selectedOption.label && selectedOption.label !== '선택 안함';
            });

            if (hasAllRequired) {
            // 옵션 조건이 맞는지 확인 (정확 일치 OR 포함 관계 허용)
            const labelMatches = (label, allowedArr) => allowedArr.some(a => a === label || label.includes(a) || a.includes(label));

                const optionsMatch = Object.entries(rule.conditions.options).every(([service, allowedOptions]) => {
                    const selectedOption = selectedOptions[service];
                    if (Array.isArray(selectedOption)) {
                    // POS 등 복수 선택: 하나라도 매칭되면 true
                    return selectedOption.some(opt => opt.label && labelMatches(opt.label, allowedOptions));
                    }
                return selectedOption && selectedOption.label && labelMatches(selectedOption.label, allowedOptions);
                });

                if (optionsMatch) {
                    applicableBenefits.push({
                        key,
                        ...rule
                    });
                }
            }
        });

        // 중복 적용 가능한 혜택 처리
        const processedBenefits = new Set();
        applicableBenefits.forEach(benefit => {
            if (!processedBenefits.has(benefit.key)) {
                const canApply = benefit.canCombineWith.every(combineKey => 
                    !processedBenefits.has(combineKey)
                );

                if (canApply) {
                    const giftCard = benefit.giftCard || 0;
                    const cash = benefit.cash || 0;

                    if (giftCard > 0 || cash > 0) {
                        result.giftCard += giftCard;
                        result.cash += cash;
                        
                        // 혜택 정보를 productBenefits 배열에 추가
                        result.productBenefits.push({
                            title: benefit.title,
                            service: 'benefit',
                            giftCard: giftCard,
                            cash: cash
                        });
                    }
                    processedBenefits.add(benefit.key);
                }
            }
        });

        return result;
    };

    // 결합 할인 찾기
    export const findComboDiscount = (selectedOptions) => {
        for (const [key, rule] of Object.entries(comboRules)) {
            // 필수 서비스가 모두 선택되었는지 확인
            const hasAllRequired = rule.conditions.required.every(serviceKey => {
                const selected = selectedOptions[serviceKey];
                if (Array.isArray(selected)) {
                    return selected.length > 0;
                }
                return selected && selected.label && selected.label !== '선택 안함';
            });

            // 선택된 옵션이 조건에 맞는지 확인
            const hasValidOptions = Object.entries(rule.conditions.options).every(([serviceKey, allowedOptions]) => {
                const selected = selectedOptions[serviceKey];
                if (Array.isArray(selected)) {
                    // 복수 선택: 하나라도 allowedOptions에 포함되면 true
                    return selected.some(opt => opt.label && allowedOptions.includes(opt.label));
                }
                return selected && allowedOptions.includes(selected.label);
            });

            if (hasAllRequired && hasValidOptions) {
                // 선택된 서비스들의 이름을 가져와서 + 로 연결
                const serviceNames = rule.conditions.required
                .map(serviceKey => getServiceName(serviceKey))
                    .join(' + ');

                return {
                    monthlyDiscount: rule.monthlyDiscount,
                    benefits: {
                        title: rule.title,
                        giftCard: 0,
                        cash: 0,
                        items: [
                            `${rule.title} (${serviceNames}) ${rule.monthlyDiscount.toLocaleString()}원`
                        ]
                    }
                };
            }
        }
        return null;
    };

    // 카드 할인 찾기
    export const findCardDiscounts = (selectedOptions) => {
        // selectedOptions이 없거나 카드 옵션이 없는 경우 early return
        if (!selectedOptions) return null;
        
        const applicableDiscounts = [];

        // KT카드 할인
        if (selectedOptions.kt_card && selectedOptions.kt_card.label !== '선택 안함') {
            const ktCardOption = cardDiscounts.kt_card.options.find(
                opt => opt.label === selectedOptions.kt_card.label
            );
            if (ktCardOption) {
                applicableDiscounts.push({
                    service: cardDiscounts.kt_card.service,
                    label: `${cardDiscounts.kt_card.name} - ${ktCardOption.label}`,
                    amount: ktCardOption.amount
                });
            }
        }

        // 텔레캅카드 할인
        if (selectedOptions.telecop_card && selectedOptions.telecop_card.label !== '선택 안함') {
            const telecopCardOption = cardDiscounts.telecop_card.options.find(
                opt => opt.label === selectedOptions.telecop_card.label
            );
            if (telecopCardOption) {
                applicableDiscounts.push({
                    service: cardDiscounts.telecop_card.service,
                    label: `${cardDiscounts.telecop_card.name} - ${telecopCardOption.label}`,
                    amount: telecopCardOption.amount
                });
            }
        }

        return applicableDiscounts.length > 0 ? applicableDiscounts : null;
    };

    // 할인/혜택 규칙 검증 함수
    export const validateRules = () => {
        const validateOption = (serviceKey, label) => {
        const service = servicesPlaceholder.find(s => s.key === serviceKey);
            return service && service.options.some(o => o.label === label);
        };

        // 모든 규칙의 조건들이 실제 services에 존재하는지 검증
        const validateConditions = (conditions) => {
            return Object.entries(conditions).every(([serviceKey, condition]) => {
                return validateOption(serviceKey, condition.label);
            });
        };

        // 각 규칙 세트 검증
        const validateRuleSet = (rules) => {
            return rules.every(rule => validateConditions(rule.conditions));
        };

        const isValid = {
            discounts: validateRuleSet(Object.values(comboRules)),
            benefits: validateRuleSet(Object.values(productBenefits)),
            cardDiscounts: validateRuleSet(Object.values(cardDiscounts))
        };

        // 유효하지 않은 규칙이 있다면 콘솔에 경고
        if (!isValid.discounts) console.warn('일부 할인 규칙이 유효하지 않습니다.');
        if (!isValid.benefits) console.warn('일부 혜택 규칙이 유효하지 않습니다.');
        if (!isValid.cardDiscounts) console.warn('일부 카드할인 규칙이 유효하지 않습니다.');

        return isValid;
    }; 