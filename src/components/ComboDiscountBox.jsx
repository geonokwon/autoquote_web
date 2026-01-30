import { Box, Typography } from '@mui/material';

// helper: flatten discount options (handles array/non-array)
const getDiscountItems = (selectedOptions, services) => {
  const list = [];
  Object.entries(selectedOptions).forEach(([key, value]) => {
    const service = services.find((s) => s.key === key);
    if (!service?.isDiscount) return;
    if (Array.isArray(value)) {
      value.forEach((v, idx) => list.push({ svcKey: key, opt: v, idx }));
    } else if (value && typeof value === 'object') {
      list.push({ svcKey: key, opt: value, idx: 0 });
    }
  });
  return list;
};

function ComboDiscountBox({ selectedOptions, services, applyComboRules }) {
    const discountItems = getDiscountItems(selectedOptions, services)
        .filter(({ opt }) => typeof opt.price === 'number' && opt.price < 0 && opt.price !== 0);

    // subtotal of manual discounts + auto combo discounts
    const manualSum = discountItems.reduce((sum, { opt }) => sum + opt.price, 0);
    const autoDiscounts = applyComboRules(selectedOptions).discounts || [];
    const autoSum = autoDiscounts.reduce((sum, d) => sum - Math.abs(d.amount), 0); // store negative

    return (
        <Box sx={{ flex: 1, mb: 2 }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                        fontFamily: 'GmarketSansBold',
                        color: 'white',
                        fontSize: '1.06rem',
                        textAlign: 'center'
                    }}>
                        결합할인
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {/* 직접할인 표시 */}
                {discountItems.map(({ svcKey, opt, idx }) => (
                    <Box key={`${svcKey}-${idx}`} sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            borderBottom: '1.3px solid #BFBFBF',
                            py: 0.1
                        }}>
                        <Box sx={{ width: '260px' }}>
                            <Typography sx={{ fontFamily:'GmarketSansMedium', color:'#4F5352', fontSize:'0.85rem', textAlign:'left', pl:2 }}>
                                {opt.customLabel || opt.label}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100px' }}>
                            <Typography sx={{ width:'100px', textAlign:'right', fontFamily:'GmarketSansBold', color:'#4F5352', fontSize:'0.85rem' }}>
                                {opt.price.toLocaleString()}원
                            </Typography>
                        </Box>
                    </Box>
                    ))}

                {/* 자동 결합할인 표시 */}
                {applyComboRules(selectedOptions).discounts
                    .filter(discount => discount.amount !== 0) // 0원인 항목 제외
                    .map((discount, index) => (
                    <Box key={index} sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        borderBottom: '1.3px solid #BFBFBF',
                        py: 0.3
                    }}>
                        <Box sx={{
                            width: '260px',
                        }}>
                            <Typography sx={{ 
                                fontFamily: 'GmarketSansMedium',
                                color: '#4F5352',
                                fontSize: '0.85rem',
                                textAlign: 'left',
                                pl:2
                            }}>
                                {discount.label}
                            </Typography>
                        </Box>
                        
                        <Typography sx={{ 
                            width: '100px',
                            textAlign: 'right',
                            fontFamily: 'GmarketSansBold',
                            color: '#4F5352',  
                            fontSize: '0.85rem',
                        }}>
                            {(-discount.amount).toLocaleString()}원
                        </Typography>
                    </Box>
                ))}
                
                {/* 결합할인 소계 */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5,
                    py: 0.3,
                    pr: 2.4,
                    bgcolor: '#f6f6f6',
                    borderRadius: 1
                }}>
                    <Box sx={{
                        width: '64px',
                    }}>
                        <Typography sx={{ 
                            color: '#FF1B1B',
                            textAlign: 'center',
                            fontFamily: 'GmarketSansBold',
                            fontSize: '0.9rem',
                        }}>
                            소계
                        </Typography>
                    </Box>
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1px'
                    }}>
                        <Typography sx={{ 
                            color: '#FF1B1B',
                            fontFamily: 'GmarketSansBold',
                            fontSize: '0.9rem',
                            textAlign: 'right',
                            width: '180px'
                        }}>
                            {(manualSum + autoSum).toLocaleString()}원
                        </Typography>
                    </Box>
                    
                </Box>
            </Box>
        </Box>
    )
}

export default ComboDiscountBox;