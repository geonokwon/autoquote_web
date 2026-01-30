import React from 'react';
import { Box, Typography } from '@mui/material';

// flatten discount options (array+object) helper
const collectDiscountItems = (selectedOptions, services) => {
    const list = [];
    Object.entries(selectedOptions).forEach(([key, val]) => {
        const svc = services.find(s=>s.key===key);
        if(!svc?.isDiscount) return;
        if (Array.isArray(val)) {
            val.forEach(v=> list.push(v));
        } else if (val && typeof val==='object') {
            list.push(val);
        }
    });
    return list.filter(item=> typeof item.price==='number' && item.price<0);
};

function TotalAmountBox({ 
    originalTotal,
    selectedOptions,
    services,
    isCardDiscountApplied,
    applyComboRules
}) {
    // 할인금액 계산
    const calculateDiscountAmount = () => {
        const manualSum = collectDiscountItems(selectedOptions, services)
            .reduce((s,it)=> s + it.price, 0);
        const autoSum = (applyComboRules(selectedOptions).discounts || [])
            .reduce((sum,d)=> sum - Math.abs(d.amount), 0);
        const discountAmount = manualSum + autoSum;
        return discountAmount === 0 ? '0' : `-${Math.abs(discountAmount).toLocaleString()}`;
    };

    // 카드할인금액 계산
    const calculateCardDiscountAmount = () => {
        if (!isCardDiscountApplied) return '0';
        return `-${services
            .filter(service => 
                service.isCardDiscount && 
                selectedOptions[service.key]?.label !== '선택 안함' && 
                selectedOptions[service.key]?.price > 0
            )
            .reduce((sum, service) => sum + (selectedOptions[service.key]?.price || 0), 0)
            .toLocaleString()}`;
    };

    // 최종금액 계산
    const calculateFinalAmount = () => {
        const originalAmount = originalTotal;
        
        const comboDiscountAmount = collectDiscountItems(selectedOptions, services)
            .reduce((sum,it)=> sum + it.price, 0);
        const autoComboDiscountAmount = (applyComboRules(selectedOptions).discounts||[])
            .reduce((sum,d)=> sum - Math.abs(d.amount), 0);
        
        const cardDiscountAmount = isCardDiscountApplied 
            ? services
                .filter(service => 
                    service.isCardDiscount && 
                    selectedOptions[service.key]?.label !== '선택 안함' && 
                    selectedOptions[service.key]?.price > 0
                )
                .reduce((sum, service) => sum + (selectedOptions[service.key]?.price || 0), 0)
            : 0;
        
        return (originalAmount + comboDiscountAmount + autoComboDiscountAmount - cardDiscountAmount).toLocaleString();
    };

    return (
        <Box sx={{ 
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            pt: 1,
            pb: 0.5,
            pl: 0.6,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'auto auto',
            gap: 0.1,
            maxWidth: '870px',
            width: '100%',
            mx: 'auto',
            pr: 2,
            background: 'linear-gradient(90deg, #82C8D4 0%, #0C9CB1 100%)'
        }}>
            {/* 1행: 항목명 */}
            <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                원가
            </Typography>
            <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                할인금액
            </Typography>
            <Typography
                sx={{
                    fontFamily: 'GmarketSansMedium',
                    fontSize: '0.9rem',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', 
                    width: '100%',            
                }}
            >
                카드할인
                <Typography
                    component="span"
                    sx={{
                        fontFamily: 'GmarketSansMedium',
                        fontSize: '0.8rem',
                        color: '#ffe600',
                        ml: 0.5
                    }}
                >
                    ({isCardDiscountApplied ? '적용' : '미적용'})
                </Typography>
            </Typography>
            <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '0.9rem', color: '#fff', textAlign: 'center' }}>
                월 납입료
                <Box
                    component="span"
                    sx={{
                        fontFamily: 'GmarketSansMedium',
                        fontSize: '0.7rem',
                        color: '#ffe600',
                        ml: 0.5,
                        lineHeight: 1
                    }}
                >
                    (VAT별도)
                </Box>
            </Typography>
            

            {/* 2행: 값 */}
            <Typography sx={{ 
                fontFamily: 'GmarketSansBold',
                color: 'white', 
                fontSize: '1.2rem', 
                textAlign: 'center' 
            }}>
                {originalTotal.toLocaleString()}원
            </Typography>
            <Typography sx={{ 
                fontFamily: 'GmarketSansBold',
                color: '#ffd200', 
                fontSize: '1.2rem', 
                textAlign: 'center' 
            }}>
                {calculateDiscountAmount()}원
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography sx={{ 
                    fontFamily: 'GmarketSansBold', 
                    color: '#ffd200', 
                    fontSize: '1.2rem', 
                    textAlign: 'center' 
                }}>
                    {calculateCardDiscountAmount()}원
                </Typography>
            </Box>
            <Typography sx={{ 
                fontFamily: 'GmarketSansBold', 
                color: '#fcff00', 
                fontSize: '1.2rem', 
                textAlign: 'center' 
            }}>
                {calculateFinalAmount()}원
            </Typography>
        </Box>
    );
}

export default TotalAmountBox; 