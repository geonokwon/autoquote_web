import { Box, Typography } from '@mui/material';

// 카드할인 박스 컴포넌트 분리
function CardDiscountBox({ selectedOptions, services, isCardDiscountApplied }) {
    return (
    <Box sx={{flex: 1, mb: 2 }}>
        <Box sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                background: 'linear-gradient(90deg,#0C9CB1 0%,#82C8D4 100%)',
                px: 2,
                py: 0.2,
                mb: 0.5,
            }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                        fontFamily: 'GmarketSansBold',
                        color: 'white',
                        fontSize: '1.06rem',
                        textAlign: 'center',
                        width: '100%',
                        }}
                    >
                        카드할인
                    </Typography>
                </Box>
            <Typography
                sx={{
                position: 'absolute',
                right: 14, // px 단위, 필요시 조정
                top: '68%',
                transform: 'translateY(-50%)',
                fontFamily: 'GmarketSansBold',
                fontSize: '0.75rem',
                color: isCardDiscountApplied ? '#ffe600' : 'white',
                whiteSpace: 'nowrap',
                zIndex: 1,
                }}
            >
                {isCardDiscountApplied ? '카드할인 적용' : '❗️카드할인 미적용'}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        {services
            .filter(service =>
                service.isCardDiscount &&
                selectedOptions[service.key]?.label !== '선택 안함' &&
                selectedOptions[service.key]?.price > 0
            ).map(service => {
                    const opt = selectedOptions[service.key];
                    return (
                        <Box key={service.key} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1.3px solid #BFBFBF',
                            py: 0.1
                        }}>
                            <Box sx={{
                                width: '140px',
                                mr: 1,
                            }}>
                                <Typography sx={{
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    textAlign: 'left',
                                    pl:2
                                }}>
                                    {service.name}
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                minWidth: '160px',
                                gap: 0.5
                            }}>
                                <Typography sx={{
                                    fontFamily: 'GmarketSansMedium',
                                    color: '#4F5352',
                                    fontSize: '0.85rem',
                                    minWidth: '180px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                    
                                }}>
                                    {opt.label}
                                </Typography>
                            </Box>
                            <Typography sx={{
                                width: '100px',
                                textAlign: 'right',
                                fontFamily: 'GmarketSansBold',
                                color: '#4F5352',
                                fontSize: '0.85rem',
                                pr: 2,
                            }}>
                                -{opt.price.toLocaleString()}원
                            </Typography>
                        </Box>      
            );
        })}
        <Box sx={{
            display: 'flex', 
            alignItems: 'center',
            mt: 0.5,
            py: 0.3,
            pr: 1.7,
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
                    -{services.filter(service => service.isCardDiscount && selectedOptions[service.key]?.label !== '선택 안함' &&selectedOptions[service.key]?.price > 0 )
                        .reduce((sum, service) => sum + (selectedOptions[service.key]?.price || 0), 0)
                        .toLocaleString()}원
                </Typography>
            </Box>
        </Box>
    </Box>
    </Box>
    );
}

export default CardDiscountBox;