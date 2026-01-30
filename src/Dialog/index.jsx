import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Divider,
    FormControl,
    InputAdornment,
} from '@mui/material';

const OptionDialog = ({
    open,
    onClose,
    activeServiceKey,
    selectedOptions,
    manualInputs,
    onOptionChange,
    onManualInputChange,
    onHighorderQuantityChange,
    removeHighorderOption,
    onPosQuantityChange,
    removePosOption,
    onSave,
    extraBenefits,
    customGiftCard,
    setCustomGiftCard,
    customCash,
    setCustomCash,
    services = [],
}) => {
    const service = services.find((s) => s.key === activeServiceKey);
    const currentMulti = Array.isArray(selectedOptions[activeServiceKey]) ? selectedOptions[activeServiceKey] : [];
    const isMultiService = service?.meta?.multiSelect;
    if (!service) return null;

    let groups = [];
    let currentGroup = {
        title: '',
        options: []
    };

    // 옵션들을 그룹으로 구성
    service.options.forEach((opt) => {
        if (opt.type === 'divider') {
            if (currentGroup.options.length > 0) {
                groups.push({ ...currentGroup });
            }
            currentGroup = {
                title: opt.label,
                options: []
            };
        } else {
            currentGroup.options.push(opt);
        }
    });
    if (currentGroup.options.length > 0) {
        groups.push(currentGroup);
    }

    const renderOptions = () => {
        switch (activeServiceKey) {
            case 'manual_combo':
    return (
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="결합할인 제목"
                                type="text"
                                value={manualInputs[activeServiceKey]?.label || ''}
                                onChange={(e) => onManualInputChange(activeServiceKey, 'label', e.target.value)}
                                placeholder="예: 프리미엄 결합 할인"
                                fullWidth
                                autoFocus
                                sx={{ fontFamily: 'GmarketSansMedium' }}
                            />
                            <TextField
                                label="월 할인 금액"
                                type="text"
                                value={(manualInputs[activeServiceKey]?.price || 0).toLocaleString()}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, '');
                                    onManualInputChange(activeServiceKey, 'price', Number(value));
                                }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">원</InputAdornment>
                                }}
            fullWidth
                                sx={{ fontFamily: 'GmarketSansMedium' }}
                            />
                        </Box>
                    </Box>
                );
            case 'extraBenefit':
                return (
                    <Box>
                        <RadioGroup
                            value={selectedOptions[activeServiceKey]?.label || ''}
                            onChange={(e) => {
                                const selectedLabel = e.target.value;
                                const selectedBenefit = extraBenefits.find(b => b.label === selectedLabel);
                                if (selectedLabel === '직접입력') {
                                    onOptionChange({
                                        label: selectedLabel,
                                        benefits: {
                                            giftCard: 0,
                                            cash: 0
                                        }
                                    });
                                } else {
                                    onOptionChange({
                                        label: selectedLabel,
                                        benefits: {
                                            giftCard: selectedBenefit?.giftCard || 0,
                                            cash: selectedBenefit?.cash || 0
                                        }
                                    });
                                }
                            }}
                        >
                            {extraBenefits.map((benefit) => (
                                <FormControlLabel
                                    key={benefit.label}
                                    value={benefit.label}
                                    control={<Radio />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography sx={{ fontFamily: 'GmarketSansMedium' }}>{benefit.label}</Typography>
                                            {benefit.label !== '직접입력' && (
                                                <Typography sx={{ color: 'text.secondary', fontFamily: 'GmarketSansMedium' }}>
                                                    {benefit.giftCard ? `상품권 ${benefit.giftCard.toLocaleString()}원` : ''}
                                                    {benefit.giftCard && benefit.cash ? ' + ' : ''}
                                                    {benefit.cash ? `현금 ${benefit.cash.toLocaleString()}원` : ''}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            ))}
                        </RadioGroup>
                        {selectedOptions[activeServiceKey]?.label === '직접입력' && (
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="상품명"
                                    type="text"
                                    value={manualInputs[activeServiceKey]?.label || ''}
                                    onChange={(e) => onManualInputChange(activeServiceKey, 'label', e.target.value)}
                                    placeholder="상품명을 입력하세요"
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                                <TextField
                                    label="상품권 지원"
                                    type="text"
                                    value={(customGiftCard || 0).toLocaleString()}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        setCustomGiftCard(Number(value));
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>
                                    }}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                                <TextField
                                    label="현금 지원"
                                    type="text"
                                    value={(customCash || 0).toLocaleString()}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        setCustomCash(Number(value));
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>
                                    }}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                            </Box>
                        )}
                    </Box>
                );
            case 'pos':
                return (
                    <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {groups.map((group, groupIndex) => (
                            <Box key={groupIndex}>
                                {group.title && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontFamily: 'GmarketSansMedium' }}>
                                            {group.title}
                                        </Typography>
                                        <Divider />
                                    </Box>
                                )}
                                <RadioGroup
                                    value={currentMulti.map(item => item.label)}
                                    onChange={() => {}}
                                    sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}
                                >
                                    {group.options.map((opt, optIndex) => {
                                        const checked = currentMulti.some(item => item.label === opt.label);
                                        return (
                                            <FormControlLabel
                                                key={opt.label}
                                                value={opt.label}
                                                control={
                                                    <Radio
                                                        checked={checked}
                                                        onClick={() => {
                                                            if (checked) {
                                                                const idx = currentMulti.findIndex(item => item.label === opt.label);
                                                                if (idx !== -1) removePosOption(idx);
                                                            } else {
                                                                if (currentMulti.length < (service?.meta?.maxSelect || 2)) {
                                                                    const fullOpt = { ...opt };
                                                                    if (typeof fullOpt.oneTimePayment === 'undefined') {
                                                                        const found = service.options.find(o => o.label === opt.label);
                                                                        if (found && typeof found.oneTimePayment !== 'undefined') {
                                                                            fullOpt.oneTimePayment = found.oneTimePayment;
                                                                        }
                                                                    }
                                                                    onOptionChange({
                                                                        label: fullOpt.label,
                                                                        price: fullOpt.price,
                                                                        oneTimePayment: fullOpt.oneTimePayment,
                                                                        benefits: {
                                                                            oneTimePayment: fullOpt.oneTimePayment
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        sx={{
                                                            color: 'rgba(0,0,0,0.54)',
                                                            '&.Mui-checked': { color: '#1976d2' },
                                                            width: 22,
                                                            height: 22,
                                                            mr: 1
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '14px', lineHeight: 1.1 }}>
                                                        {opt.label}
                                                        {(() => {
                                                            const toNum = (v) => {
                                                                if (typeof v === 'number') return v;
                                                                if (typeof v === 'string') return parseInt(v.replace(/[^\d-]/g, ''), 10) || 0;
                                                                return 0;
                                                            };
                                                            const monthly = toNum(opt.price);
                                                            const otp = toNum(opt.oneTimePayment);
                                                            if (monthly > 0) {
                                                                return (
                                                                    <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: 2 }}>
                                                                        (월 {monthly.toLocaleString()}원)
                                                                    </span>
                                                                );
                                                            }
                                                            if (otp > 0) {
                                                                return (
                                                                    <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: 2 }}>
                                                                        (일시납 {otp.toLocaleString()}원)
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </Typography>
                                                }
                                                sx={{
                                                    gridColumn: Math.floor(optIndex / 4) + 1,
                                                    gridRow: (optIndex % 4) + 1,
                                                    backgroundColor: checked ? '#e3f2fd' : 'transparent',
                                                    borderRadius: 1,
                                                    transition: 'background 0.2s',
                                                    px: 1,
                                                    py: 0.5,
                                                    margin: 0,
                                                    '&:hover': {
                                                        backgroundColor: checked ? '#e3f2fd' : '#f5f5f5'
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </RadioGroup>
                            </Box>
                        ))}
                    </Box>
                    {currentMulti.length > 0 && (
                        <Box sx={{ mt: 3, width: '100%' }}>
                            {currentMulti.map((item, index) => (
                                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontFamily: 'GmarketSansMedium' }}>{item.label}</Typography>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => removePosOption(index)}
                                            variant="outlined"
                                        >
                                            삭제
                                        </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                        <TextField
                                            label="수량"
                                            type="number"
                                            value={item.quantity || 1}
                                            onChange={e => onPosQuantityChange(index, e.target.value)}
                                            InputProps={{
                                                inputProps: { min: 1, max: 999 },
                                                sx: { textAlign: 'center', fontFamily: 'GmarketSansMedium' }
                                            }}
                                            sx={{ width: '80px', fontFamily: 'GmarketSansMedium' }}
                                        />
                                        <Box sx={{ 
                                            bgcolor: '#f5f5f5',
                                            p: 1.5,
                                            borderRadius: 1,
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.5,
                                            fontFamily: 'GmarketSansMedium'
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                단가: {(() => {
                                                    const unit = item.unitPrice ?? (item.price && item.quantity ? Math.round(item.price / item.quantity) : 0);
                                                    return unit.toLocaleString();
                                                })()}원
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                수량: {item.quantity || 1}개
                                            </Typography>
                                            <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                                합계: {(item.price || 0).toLocaleString()}원
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                            {currentMulti.length < (service?.meta?.maxSelect || 2) && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'GmarketSansMedium' }}>
                                    추가 선택 가능 ({(service?.meta?.maxSelect || 2) - currentMulti.length}개)
                                </Typography>
                            )}
                        </Box>
                    )}
                    </>
                );
            default:
                return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {groups.map((group, groupIndex) => (
                        <Box key={groupIndex}>
                            {group.title && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontFamily: 'GmarketSansMedium' }}>
                                        {group.title}
                                    </Typography>
                                    <Divider />
                                </Box>
                            )}
                            <RadioGroup
                                value={activeServiceKey === 'highorder' ? '' : (selectedOptions[activeServiceKey]?.label || '')}
                                onChange={(e) => {
                                    const option = service.options.find((opt) => opt.label === e.target.value);
                                    if (option) {
                                        onOptionChange(option);
                                    }
                                }}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 2,
                                    '& .MuiFormControlLabel-root': {
                                        margin: 0
                                    }
                                }}
                            >
                                {group.options.map((opt, optIndex) => (
                                    <FormControlLabel
                                        key={opt.label}
                                        value={opt.label}
                                        control={
                                            <Radio 
                                                checked={isMultiService ? currentMulti.some(item => item.label === opt.label) : selectedOptions[activeServiceKey]?.label === opt.label}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '14px', lineHeight: 1.1 }}>
                                                {opt.label}
                                                {(() => {
                                                    const toNum = (v) => {
                                                        if (typeof v === 'number') return v;
                                                        if (typeof v === 'string') return parseInt(v.replace(/[^\d-]/g, ''), 10) || 0;
                                                        return 0;
                                                    };
                                                    const monthly = toNum(opt.price);
                                                    const otp = toNum(opt.oneTimePayment);
                                                    if (monthly > 0) {
                                                        return (
                                                            <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: 2 }}>
                                                                (월 {monthly.toLocaleString()}원)
                                                            </span>
                                                        );
                                                    }
                                                    if (otp > 0) {
                                                        return (
                                                            <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: 2 }}>
                                                                (일시납 {otp.toLocaleString()}원)
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </Typography>
                                        }
                                        sx={{
                                            gridColumn: Math.floor(optIndex / 4) + 1,
                                            gridRow: (optIndex % 4) + 1
                                        }}
                                    />
                                ))}
                            </RadioGroup>
                        </Box>
                    ))}
                </Box>
                );
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => onClose(false)} 
            maxWidth="md" 
            fullWidth
        >
            <DialogTitle sx={{ fontFamily: 'GmarketSansMedium' }}>옵션 선택</DialogTitle>
            <DialogContent sx={{ minWidth: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
                {renderOptions()}

                {selectedOptions[activeServiceKey]?.label === '직접입력' && activeServiceKey !== 'extraBenefit' && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {activeServiceKey === 'manual_discount' ? (
                            <>
                                <TextField
                                    label="항목 이름"
                                    value={manualInputs[activeServiceKey]?.label || ''}
                                    onChange={(e) => onManualInputChange(activeServiceKey, 'label', e.target.value)}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                                <TextField
                                    label="할인 금액"
                                    value={manualInputs[activeServiceKey]?.price?.toLocaleString() || ''}
                                    onChange={(e) => {
                                        const numeric = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                                        onManualInputChange(activeServiceKey, 'price', numeric);
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>
                                    }}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                            </>
                        ) : (
                            <>
                                <TextField
                                    label="상품명"
                                    value={manualInputs[activeServiceKey]?.label || ''}
                                    onChange={(e) => onManualInputChange(activeServiceKey, 'label', e.target.value)}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                                <TextField
                                    label="월 이용료"
                                    value={manualInputs[activeServiceKey]?.price?.toLocaleString() || ''}
                                    onChange={(e) => {
                                        const numeric = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                                        onManualInputChange(activeServiceKey, 'price', numeric);
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>
                                    }}
                                    sx={{ fontFamily: 'GmarketSansMedium' }}
                                />
                                {!service.isDiscount && (
                                    <TextField
                                        label="일시납 금액"
                                        value={manualInputs[activeServiceKey]?.oneTimePayment?.toLocaleString() || ''}
                                        onChange={(e) => {
                                            const numeric = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                                            onManualInputChange(activeServiceKey, 'oneTimePayment', numeric);
                                        }}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">원</InputAdornment>
                                        }}
                                        sx={{ fontFamily: 'GmarketSansMedium' }}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                )}

                {activeServiceKey === 'highorder' && currentMulti.length > 0 && (
                    <Box sx={{ mt: 3, width: '100%' }}>
                        {currentMulti.map((item, index) => (
                            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontFamily: 'GmarketSansMedium' }}>{item.label}</Typography>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => removeHighorderOption(index)}
                                        variant="outlined"
                                    >
                                        삭제
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                    <TextField
                                        label="수량"
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => onHighorderQuantityChange(index, e.target.value)}
                                        InputProps={{
                                            inputProps: { 
                                                min: (item.label === '하이오더(선불형,포스기무료)' || item.label === '하이오더(후불형,포스기무료)') ? 8 : 1, 
                                                max: 999 
                                            },
                                            sx: { textAlign: 'center', fontFamily: 'GmarketSansMedium' }
                                        }}
                                        sx={{ width: '80px', fontFamily: 'GmarketSansMedium' }}
                                    />
                                    <Box sx={{ 
                                        bgcolor: '#f5f5f5',
                                        p: 1.5,
                                        borderRadius: 1,
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.5,
                                        fontFamily: 'GmarketSansMedium'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            단가: {(() => {
                                                const unit = item.unitPrice ?? (item.price && item.quantity ? Math.round(item.price / item.quantity) : 0);
                                                return unit.toLocaleString();
                                            })()}원
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            수량: {item.quantity}개
                                        </Typography>
                                        <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                            합계: {(item.price || 0).toLocaleString()}원
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                        {currentMulti.length < (service?.meta?.maxSelect || 2) && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'GmarketSansMedium' }}>
                                추가 선택 가능 ({(service?.meta?.maxSelect || 2) - currentMulti.length}개)
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button 
                    onClick={() => onClose(false)} 
                    color="inherit"
                    variant="outlined"
                >
                    닫기
                </Button>
                {(activeServiceKey === 'highorder' || 
                    activeServiceKey === 'pos' ||
                    (activeServiceKey === 'extraBenefit' && selectedOptions[activeServiceKey]?.label === '직접입력') ||
                    (selectedOptions[activeServiceKey]?.label === '직접입력' && 
                    manualInputs[activeServiceKey]?.label && 
                    (manualInputs[activeServiceKey]?.price >= 0 || manualInputs[activeServiceKey]?.oneTimePayment >= 0))) && (
                    <Button 
                        onClick={onSave} 
                        color="primary"
                        variant="contained"
                    >
                        저장
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default OptionDialog; 