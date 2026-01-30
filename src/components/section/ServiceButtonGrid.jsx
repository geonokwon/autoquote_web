import React from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * Button grid for service selection, reused by GenericSection.
 * Props:
 *  - serviceKeys: array of service key strings to display
 *  - selectedOptions: selections map
 *  - onOpenDialog: click handler
 *  - buttonColor: MUI color (default primary)
 *  - services: optional services list (defaults to constants)
 */
export default function ServiceButtonGrid({
    serviceKeys = [],
    selectedOptions = {},
    onOpenDialog,
    buttonColor = 'primary',
    services = []
}) {
    const findService = (key) => services.find((s) => s.key === key);

    const renderButton = (serviceKey) => {
        const service = findService(serviceKey);
        if (!service) return null;

        const selectedVal = selectedOptions[serviceKey];
        const isSelected = Array.isArray(selectedVal)
        ? selectedVal.length > 0
        : selectedVal && selectedVal.label && selectedVal.label !== '선택 안함';

        return (
        <Box key={serviceKey} sx={{ width: 260, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
                variant={isSelected ? 'contained' : 'outlined'}
                color={buttonColor}
                sx={{ width: '100%', height: 48, fontSize: '1.1rem' }}
                onClick={() => onOpenDialog(serviceKey)}
            >
                {service.name}
            </Button>
            {isSelected && (
            <Box sx={{ mt: 1, width: '100%' }}>
                {Array.isArray(selectedVal) ? (
                selectedVal.map((item, idx) => (
                    <Typography
                    key={idx}
                    variant="body2"
                    sx={{ fontFamily: 'Pretendard-Bold', fontWeight: 700, color: '#616161', textAlign: 'left' }}
                    >
                    {item.customLabel || item.label}
                    {item.quantity > 1 ? ` (x${item.quantity})` : ''}
                    {item.price > 0 ? ` - ${item.price.toLocaleString()}원` : ''}
                    </Typography>
                ))
                ) : (
                <Typography
                    variant="body2"
                    sx={{ fontFamily: 'Pretendard-Bold', fontWeight: 700, color: '#616161', textAlign: 'left' }}
                >
                    {selectedVal.customLabel || selectedVal.label}
                    {selectedVal.quantity && selectedVal.quantity>1 ? ` (x${selectedVal.quantity})` : ''}
                    {(() => {
                    if (selectedVal.price && selectedVal.price > 0) return ` - ${selectedVal.price.toLocaleString()}원`;
                    const b = selectedVal.benefits || {};
                    const parts = [];
                    if (b.giftCard) parts.push(`상품권 ${b.giftCard.toLocaleString()}원`);
                    if (b.cash) parts.push(`현금 ${b.cash.toLocaleString()}원`);
                    return parts.length ? ` - ${parts.join(', ')}` : '';
                    })()}
                </Typography>
                )}
            </Box>
            )}
        </Box>
        );
    };

    return (
        <Box
            sx={{
                width: 800,
                mx: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                justifyItems: 'center',
                alignItems: 'start'
            }}
            >
            {serviceKeys.map(renderButton)}
        </Box>
    );
} 