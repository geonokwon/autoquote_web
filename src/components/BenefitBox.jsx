import { Box, Typography, Chip } from '@mui/material';
import { productLabelMap } from '../utils/productLabelMap';

// helper to get label from services list or fallback map
const getLabelForKey = (servicesList, key) => {
    const svc = servicesList?.find?.(s => s.key === key);
    return (svc && svc.label) || productLabelMap[key] || '';
};

function BenefitBox({ productBenefits, benefitResults, selectedOptions, isBusiness, services = [], activeBundles = [], selectedServiceKeys = [] }) {
    // 상품별 혜택(사업자면 TV 상품권 0원) 합산
    const totalGiftCard = productBenefits.productBenefits.reduce(
        (sum, benefit) => sum + (benefit.giftCard || 0), 0
    );
    const totalCash = productBenefits.productBenefits.reduce(
        (sum, benefit) => sum + (benefit.cash || 0), 0
    );
    const totalGiftCardAll = totalGiftCard + (benefitResults.giftCard || 0);
    const totalCashAll = totalCash + (benefitResults.cash || 0);

    // 하이오더 혜택만 label별로 그룹핑 및 수량 합산
    const groupedHighorder = {};
    productBenefits.productBenefits.forEach(b => {
        if (b.service === 'highorder') {
            const key = b.label || b.title;
            if (!groupedHighorder[key]) groupedHighorder[key] = { ...b, quantity: 0 };
            groupedHighorder[key].quantity += b.quantity || 1;
        }
    });
    // 나머지 서비스는 그대로, 하이오더는 그룹핑된 값만 map
    const mergedBenefits = [
        ...Object.values(groupedHighorder),
        ...productBenefits.productBenefits.filter(b => b.service !== 'highorder')
    ].filter(b => (b.giftCard || 0) > 0 || (b.cash || 0) > 0); // 0원 혜택은 렌더링하지 않음

    // Bundle 혜택별 계산
    const bundleRows = activeBundles.map(bundle => {
        const matchedBenefits = (benefitResults.productBenefits||[]).filter(pb => (bundle.ruleKeys||[]).includes(pb.key));
        const giftCard = matchedBenefits.reduce((s,b)=> s+(b.giftCard||0),0);
        const cash = matchedBenefits.reduce((s,b)=> s+(b.cash||0),0);
        return { bundle, giftCard, cash };
    }).filter(r=> (r.giftCard||0)+(r.cash||0) > 0);

    const anyBundle = bundleRows.length > 0;
    if (mergedBenefits.length === 0 && totalGiftCardAll === 0 && totalCashAll === 0 && !anyBundle) {
        return null;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                background: 'linear-gradient(90deg,#0C9CB1 0%,#82C8D4 100%)',
                px: 2,
                py: 0.2,
                mb: 0.5,
            }}>
                {/* 중앙: 혜택 안내 + 로고 */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Typography variant="subtitle1" sx={{ 
                        fontFamily: 'GmarketSansBold',
                        color: 'white',
                        fontSize: '1.06rem',
                        textAlign: 'center',
                        ml: 8
                    }}>
                        혜택 안내
                    </Typography>
                </Box>
                {/* 오른쪽 끝: 총혜택 */}
                <Box sx={{ minWidth: 10, textAlign: 'right' }}>
                    <Typography sx={{ 
                        fontFamily: 'GmarketSansBold',
                        color: 'white',
                        fontSize: '1.0rem',
                    }}>
                        총 혜택
                    </Typography>
                </Box>
            </Box>

            {/* 상품별 기본 혜택 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {mergedBenefits.map((benefit, index) => {
                    const giftCard = benefit.giftCard;
                    // 하이오더 라벨에서 '일시납' 제거
                    let displayLabel = benefit.label;
                    if (benefit.service === 'highorder' && displayLabel) {
                        displayLabel = displayLabel.replace('일시납,', '').replace(',일시납', '').replace('일시납', '').replace(',,', ',').replace(/^,|,$/g, '').trim();
                    }
                    return (
                        <Box key={`product-${index}`} sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            borderBottom: '1.3px solid #BFBFBF',
                            py: 0.1
                        }}>
                            <Typography sx={{ 
                                width: '240px',
                                fontFamily: 'GmarketSansMedium',
                                color: '#4F5352',
                                fontSize: '0.85rem',
                                textAlign: 'left',
                                pl: 2
                            }}>
                                {benefit.service === 'highorder'
                                    ? `하이오더- ${displayLabel}${benefit.quantity > 1 ? ` x${benefit.quantity}` : ''}`
                                    : benefit.service === 'extraBenefit'
                                        ? (()=>{
                                            const t = benefit.title || selectedOptions[benefit.service]?.label || '혜택';
                                            // 프리셋(소상공인 혜택 등)에는 접두사, 직접입력(커스텀)에는 접두사 생략
                                            if (t === '소상공인 혜택') return `추가 혜택 - ${t}`;
                                            return t;
                                          })()
                                        : benefit.label
                                        ? `${benefit.title}- ` + (
                                            benefit.service === 'pos' && benefit.label.startsWith('포스+')
                                                ? benefit.label.replace(',으랏차차', '')
                                                : benefit.label
                                        )
                                        : benefit.title}
                                {benefit.service && !['extraBenefit', 'highorder'].includes(benefit.service) && selectedOptions[benefit.service]?.label ? 
                                    (benefit.service === 'smallBusinessBenefit'
                                        ? ` (${selectedOptions[benefit.service].customLabel || selectedOptions[benefit.service].label})`
                                        : `- ${selectedOptions[benefit.service].customLabel || selectedOptions[benefit.service].label}`
                                    ) : ''}
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: '90px 110px 90px 110px',
                                gap: 1,
                                flex: 1
                            }}>
                                <Typography sx={{ 
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    visibility: giftCard > 0 ? 'visible' : 'hidden'
                                }}>
                                    상품권지원
                                </Typography>
                                <Typography sx={{ 
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    textAlign: 'right',
                                    pr: 2,
                                    visibility: giftCard > 0 ? 'visible' : 'hidden'
                                }}>
                                    {giftCard.toLocaleString()}원
                                </Typography>
                                <Typography sx={{ 
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    visibility: benefit.cash > 0 ? 'visible' : 'hidden'
                                }}>
                                    현금지원
                                </Typography>
                                <Typography sx={{ 
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    textAlign: 'right',
                                    pr: 2,
                                    visibility: benefit.cash > 0 ? 'visible' : 'hidden'
                                }}>
                                    {benefit.cash.toLocaleString()}원
                                </Typography>
                            </Box>
                            <Typography sx={{ 
                                width: '100px',
                                color: '#4F5352',
                                fontFamily: 'GmarketSansBold',
                                fontSize: '0.85rem',
                                textAlign: 'right',
                                pr: 2
                            }}>
                                {(giftCard + benefit.cash).toLocaleString()}원
                            </Typography>
                        </Box>
                    );
                })}

                {/* Bundle 혜택 rows */}
                {bundleRows.map(({bundle, giftCard, cash}, idx)=>(
                    <Box key={`bundle-${idx}`} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        borderBottom: '1.3px solid #BFBFBF', 
                        bgcolor: bundle.bgColor || 'rgba(255, 0, 0, 0.1)',
                        py: 0.1 
                    }}>
                        <Typography sx={{ width: '240px', fontFamily: 'GmarketSansBold', color: '#FF1B1B', fontSize: '0.85rem', textAlign: 'left', pl: 2 }}>
                            {bundle.title}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '208px 90px 110px', gap: 1, flex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1.4, textAlign: 'center'}}>
                                {(bundle.serviceKeys||[])
                                    .filter(k=> selectedServiceKeys.includes(k))
                                    .map(key => {
                                        const lbl = getLabelForKey(services,key);
                                        if(!lbl) return null;
                                        return (
                                            <Chip key={key} label={<Box sx={{color:'#fff',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'0.74rem',p:0}}>{lbl}</Box>} size="small" sx={{borderRadius:'50%',mr:1,ml:-2.4,width:18,height:18,minWidth:0,p:0,background:'#ff9797',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:'none'}} />
                                        );
                                })}
                            </Box>
                            <Typography sx={{ color: '#FF1B1B', fontFamily: 'GmarketSansMedium', fontSize: '0.85rem', textAlign: 'center' }}>
                                현금지원
                            </Typography>
                            <Typography sx={{ color: '#FF1B1B', fontSize: '0.85rem', textAlign: 'right', fontFamily: 'GmarketSansMedium', pr: 2 }}>
                                {cash.toLocaleString()}원
                            </Typography>
                        </Box>
                        <Typography sx={{ width: '100px', color: '#FF1B1B', fontSize: '0.85rem', textAlign: 'right', fontFamily: 'GmarketSansBold', pr: 2 }}>
                            {(giftCard+cash).toLocaleString()}원
                        </Typography>
                    </Box>
                ))}

                {/* 혜택 총계 */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5,
                    py: 0.3,
                    pr: 2,
                    bgcolor: '#F2F2EF',
                    borderRadius: 1
                }}>
                    <Box sx={{
                        width: '255px',
                    }}>
                        <Typography sx={{ 
                            color: '#FF1B1B',
                            textAlign: 'left',
                            fontFamily: 'GmarketSansBold',
                            fontSize: '0.9rem',
                            pl: 2,
                        }}>혜택 총계</Typography>
                    </Box>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '90px 110px 90px 110px',
                        gap: 1,
                        flex: 1
                    }}>
                        <Typography sx={{ 
                            color: 'black',
                            fontFamily: 'GmarketSansMedium',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            visibility: totalGiftCardAll > 0 ? 'visible' : 'hidden'
                        }}>
                            상품권지원
                        </Typography>
                        <Typography sx={{ 
                            color: '#FF1B1B',
                            fontFamily: 'GmarketSansBold',
                            fontSize: '0.85rem',
                            textAlign: 'right',
                            pr: 2,
                            visibility: totalGiftCardAll > 0 ? 'visible' : 'hidden'
                        }}>
                            {totalGiftCardAll.toLocaleString()}원
                        </Typography>
                        <Typography sx={{ 
                            color: 'black',
                            fontFamily: 'GmarketSansMedium',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            visibility: totalCashAll > 0 ? 'visible' : 'hidden'
                        }}>
                            현금지원
                        </Typography>
                        <Typography sx={{ 
                            color: '#FF1B1B',
                            fontFamily: 'GmarketSansBold',
                            fontSize: '0.85rem',
                            textAlign: 'right',
                            pr: 2,
                            visibility: totalCashAll > 0 ? 'visible' : 'hidden'
                        }}>
                            {totalCashAll.toLocaleString()}원
                        </Typography>
                    </Box>
                    <Typography sx={{ 
                        width: '100px',
                        color: '#FF1B1B',
                        fontFamily: 'GmarketSansBold',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                    }}>
                    {/* <Typography sx={{ 
                        width: '100px',
                        color: '#f8ff30',
                        fontFamily: 'GmarketSansBold',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                        // WebkitTextStroke: '1px black',
                        textShadow: `
                                -2px -2px 0 #b11212,
                                0px -2px 0 #b11212,
                                2px -2px 0 #b11212,
                                -2px  0px 0 #b11212,
                                2px  0px 0 #b11212,
                                -2px  2px 0 #b11212,
                                0px  2px 0 #b11212,
                                2px  2px 0 #b11212
                            `,
                    }}> */}
                        {(totalGiftCardAll + totalCashAll).toLocaleString()}원
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default BenefitBox;