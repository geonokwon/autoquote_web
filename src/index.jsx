import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Snackbar,
    IconButton,
    Chip,
} from '@mui/material';
import { Menu as MenuIcon, ChevronRight as ChevronRightIcon, KeyboardArrowUp as KeyboardArrowUpIcon, Search as SearchIcon, Done as DoneIcon, CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import Switch from '@mui/material/Switch';

import useEstimateData from './hooks/useEstimateData.js';
import OptionPickerDialog from './components/OptionPickerDialog.jsx';
import OptionDialog from './Dialog/index';
import RecentEstimates from './RecentEstimates/index';
import { applyComboRules, applyCardDiscountRules } from './utils/applyRules';
import useServicesData from './hooks/useServicesData.js';
import useBenefitsData from './hooks/useBenefitsData.js';
import useProductBenefitRows from './hooks/useProductBenefitRows.js';
import api, { fetchMemo, saveQuote, fetchQuotes, deleteQuote } from './api.js';
import useComboRules from './hooks/useComboRules.js';
import useBenefitRules from './hooks/useBenefitRules.js';
import useBundleBenefits from './hooks/useBundleBenefits.js';
import EstimateService from './domain/EstimateService.js';

    
//KT 상품 컴포넌트
import KTProductGroup from './components/KTProductGroup';
//KT 텔레캅 컴포넌트
import KTTelecopGroup from './components/KTTelecopGroup';
//정수기/포스기 컴포넌트
import PosWaterGroup from './components/PosWaterGroup';

//카드할인 컴포넌트
import CardDiscountBox from './components/CardDiscountBox';
//결합할인 컴포넌트
import ComboDiscountBox from './components/ComboDiscountBox';
//혜택 컴포넌트
import BenefitBox from './components/BenefitBox';

//견적서 제목 섹션
import EstimateTitleSection from './components/section/EstimateTitleSection';
//서비스 섹션
import GenericSection from './components/section/GenericSection.jsx';
//총 금액 섹션
import TotalAmountBox from './components/TotalAmountBox';

const MEMO_FALLBACK = '<필수 숙지 사항>\n' +
    '■ 사은품은 서비스개통후 익주 금요일 18시 이전에 정산후 문자안내 드립니다\n' +
    '■ 인터넷 :설치비는 일회성으로 첫달 요금에 합산되어 청구\n' +
    '■ CCTV 난공사시 청구 : 층간공사, 벽타공, 선로길이 30M 이상 , 층고 3M 이상\n' +
    '☎ 대표번호 1899-6484 (문자가능)';

export default function EstimateForm() {
    const services = useServicesData();
    const comboRulesData = useComboRules();
    const benefitRuleRows = useBenefitRules();
    const bundleBenefits = useBundleBenefits();
    const extraBenefitsList = useBenefitsData();
    const productBenefitRows = useProductBenefitRows();
    const [selectedOptions, setSelectedOptions] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [activeServiceKey, setActiveServiceKey] = useState(null);
    const [manualInputs, setManualInputs] = useState({});
    const [cctvSubFilter, setCctvSubFilter] = useState({ category: '', countIndex: null });
    const [accessSubFilter, setAccessSubFilter] = useState({ category: '', countIndex: null });
    const [quantities, setQuantities] = useState({});

    // no helper needed; use Array.isArray directly

    // const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [estimateTitle, setEstimateTitle] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [overwriteDialog, setOverwriteDialog] = useState({ open: false, data: null });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [titleError, setTitleError] = useState('');

    // const [titleHelperText, setTitleHelperText] = useState('');
    const [isCardDiscountApplied, setIsCardDiscountApplied] = useState(false);
    const recentEstimatesRef = React.useRef();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [selectedExtraBenefit, setSelectedExtraBenefit] = useState('');
    const [customGiftCard, setCustomGiftCard] = useState(0);
    const [customCash, setCustomCash] = useState(0);
    const [showSticker, setShowSticker] = useState(true);
    const [defaultMemo, setDefaultMemo] = useState(MEMO_FALLBACK);
    const [stickerText, setStickerText] = useState(MEMO_FALLBACK);
    const [isStickerEditMode, setIsStickerEditMode] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [estimateDate, setEstimateDate] = useState('');
    const [isBusiness, setIsBusiness] = useState(false); // false: 사업자, true: 법인
    const [excludedCombos, setExcludedCombos] = useState([]);

    const stickerRef = useRef(null);

    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(()=>{
        api.get('/me').then(res=> setCurrentUser(res.data)).catch(()=>{});
    },[]);

    const handleLogout = async () => {
        try{ await api.post('/logout'); }catch(_){ }
        navigate('/login');
    };

    // auto-resize sticker textarea whenever text or edit mode toggles
    useEffect(() => {
        if (isStickerEditMode && stickerRef.current) {
            const el = stickerRef.current;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }, [stickerText, isStickerEditMode]);

    // 날짜 포맷팅
    const today = new Date();
    const formattedDate = `[${today.getFullYear().toString().slice(2)}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}]`;

    // 파일명에서 날짜 추출 함수
    const extractDateFromFileName = (fileName) => {
        const match = fileName.match(/^\[(\d{2}\.\d{2}\.\d{2})\]/);
        return match ? `[${match[1]}]` : formattedDate;
    };

    const [openPicker, setOpenPicker] = useState(false);
    const [pickerInitial, setPickerInitial] = useState([]);

    // helper to apply combo rules with latest data
    const applyCombo = (opts) => applyComboRules(opts, comboRulesData || {}, excludedCombos);

    const handleOpenDialog = (key) => {
        setActiveServiceKey(key);
        const service = services.find(s => s.key === key);

        // Picker를 사용할 조건: 서비스가 다중 선택(multiSelect) 지원인 경우
        //  (일반 상품뿐 아니라 manual_discount 같이 isDiscount 인 서비스도 포함)
        const usePicker = (!service?.isDiscount && !service?.isBenefit) || service?.meta?.multiSelect;
        
        if (usePicker) {
            let initialArr = [];
            if (Array.isArray(selectedOptions[key])) {
                initialArr = selectedOptions[key];
            } else if (selectedOptions[key] && typeof selectedOptions[key] === 'object') {
                // 이전에 단일 선택으로 저장된 경우에도 배열로 변환
                initialArr = [selectedOptions[key]];
            }
            setPickerInitial(initialArr);
            setOpenPicker(true);
            return;
        }

        if (key === 'pos') {
            setSelectedOptions(prev => ({
                ...prev,
                pos: Array.isArray(prev.pos) ? [...prev.pos] : []
            }));
        }
        
        // 이미 저장된 직접입력 값이 있으면 manualInputs로 복원
        const existingOption = selectedOptions[key];
        if (existingOption && existingOption.label === '직접입력') {
            setManualInputs(prev => ({
                ...prev,
                [key]: {
                    label: existingOption.label,
                    price: Math.abs(existingOption.price || existingOption.unitPrice || 0),
                    oneTimePayment: existingOption.benefits?.oneTimePayment || existingOption.oneTimePayment || 0
                }
            }));
        } else if (key === 'extraBenefit' && existingOption && existingOption.label === '직접입력 혜택') {
            // 추가 혜택 직접입력의 경우
            setManualInputs(prev => ({
                ...prev,
                [key]: {
                    label: existingOption.title || '추가 혜택'
                }
            }));
            setCustomGiftCard(existingOption.benefits?.giftCard || 0);
            setCustomCash(existingOption.benefits?.cash || 0);
            setSelectedExtraBenefit('직접입력');
            // selectedOptions도 '직접입력'로 설정
            setSelectedOptions(prev => ({
                ...prev,
                [key]: {
                    label: '직접입력',
                    benefits: {
                        giftCard: existingOption.benefits?.giftCard || 0,
                        cash: existingOption.benefits?.cash || 0
                    }
                }
            }));
        }
        
        if (service?.isDiscount) {
            if(key === 'manual_discount'){
                // 직접할인 서비스만 바로 입력 상태 (단, 이미 값이 없을 때만)
                if (!existingOption || existingOption.label === '선택 안함') {
                    setSelectedOptions(prev => ({
                        ...prev,
                        [key]: {
                            label: '직접입력',
                            price: 0,
                            isDiscount: true
                        }
                    }));
                }
            }
        } else if (service?.isBenefit) {
            // 추가 혜택 버튼을 누르면 바로 입력 상태로 설정 (단, 이미 값이 없을 때만)
            if (!existingOption || existingOption.label === '선택 안함') {
                setSelectedOptions(prev => ({
                    ...prev,
                    [key]: {
                        label: '직접입력',
                        benefits: {
                            giftCard: 0,
                            cash: 0
                        }
                    }
                }));
            }
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = (shouldSave = false) => {
        if (!shouldSave) {
            // 복수선택류는 리셋하지 않음
            if (["highorder", "pos"].includes(activeServiceKey)) {
                setOpenDialog(false);
                setActiveServiceKey(null);
                setCctvSubFilter({ category: '', countIndex: null });
                setAccessSubFilter({ category: '', countIndex: null });
                return;
            }
            // ...기존 코드 (단일 선택류만 리셋)
            setSelectedOptions((prev) => ({
                ...prev,
                [activeServiceKey]: {
                    label: '선택 안함',
                    price: 0,
                    quantity: 1
                }
            }));
            if (activeServiceKey === 'extraBenefit') {
                setSelectedExtraBenefit('');
                setCustomGiftCard(0);
                setCustomCash(0);
            }
            setQuantities((prev) => ({
                ...prev,
                [activeServiceKey]: 1
            }));
        }
        setOpenDialog(false);
        setActiveServiceKey(null);
        setCctvSubFilter({ category: '', countIndex: null });
        setAccessSubFilter({ category: '', countIndex: null });
    };

    const handleOptionChange = (option) => {
        if (activeServiceKey === 'highorder' && option.label !== '선택 안함' && option.label !== '직접입력') {
            const highArr = Array.isArray(selectedOptions.highorder) ? selectedOptions.highorder : [];
            const existingIndex = highArr.findIndex(item => item.label === option.label);
            if (existingIndex === -1 && highArr.length < 2) {
                let price = option.price * 1;
                const unitOTP = option.oneTimePayment ? option.oneTimePayment / 1 : 0;
                const otp = unitOTP * 1;
                const newItem = {
                    label: option.label,
                    price,
                    quantity: 1,
                    unitPrice: option.price,
                    benefits: { oneTimePayment: otp },
                    oneTimePayment: otp
                };
                setSelectedOptions(prev => {
                    let prevArr = Array.isArray(prev.highorder) ? prev.highorder : [];
                    return {
                    ...prev,
                        highorder: [...prevArr, newItem]
                    };
                });
            }
            return;
        }

        if (activeServiceKey === 'pos' && option.label !== '선택 안함' && option.label !== '직접입력') {
            const posArr = Array.isArray(selectedOptions.pos) ? selectedOptions.pos : [];
            const existingIndex = posArr.findIndex(item => item.label === option.label);
            if (existingIndex === -1 && posArr.length < 2) {
                const newPos = {
                    label: option.label,
                    price: option.price,
                    quantity: 1,
                    unitPrice: option.price,
                    benefits: {
                        oneTimePayment: option.oneTimePayment
                    },
                    oneTimePayment: option.oneTimePayment
                };
                setSelectedOptions(prev => {
                    let prevArr = [];
                    if (Array.isArray(prev.pos)) prevArr = prev.pos;
                    else if (prev.pos && typeof prev.pos === 'object') prevArr = [prev.pos];
                    return {
                        ...prev,
                        pos: [...prevArr, newPos]
                    };
                });
            }
            return;
        }

        // 추가 혜택 선택 처리
        if (activeServiceKey === 'extraBenefit') {
            if (option.label === '선택 안함') {
                setSelectedExtraBenefit('');
                setSelectedOptions(prev => ({
                    ...prev,
                    extraBenefit: {
                        label: '선택 안함',
                        price: 0,
                        benefits: {
                            giftCard: 0,
                            cash: 0
                        }
                    }
                }));
                handleCloseDialog(true);
                return;
            }

            setSelectedExtraBenefit(option.label);
            setSelectedOptions(prev => ({
                ...prev,
                extraBenefit: {
                    label: option.label,
                    price: 0,
                    benefits: {
                        giftCard: option.label === '직접입력' ? 0 : option.benefits?.giftCard || 0,
                        cash: option.label === '직접입력' ? 0 : option.benefits?.cash || 0
                    }
                }
            }));
            if (option.label === '직접입력') {
                setCustomGiftCard(0);
                setCustomCash(0);
                return;
            }
            handleCloseDialog(true);
            return;
        }

        const benefits = {};
        if (option.giftCard) benefits.giftCard = option.giftCard;
        if (option.cash) benefits.cash = option.cash;
        if (option.oneTimePayment) benefits.oneTimePayment = option.oneTimePayment;

        // 선택된 옵션 업데이트
        setSelectedOptions(prev => {
            const newOptions = {
            ...prev,
            [activeServiceKey]: {
                ...option,
                quantity: 1,
                    price: services.find(s => s.key === activeServiceKey)?.isDiscount ? -(option.price || 0) : (option.price || 0),
                unitPrice: option.price || 0,
                benefits
            }
            };

            // 할인 규칙 적용
            if (option.label !== '선택 안함' && option.label !== '직접입력') {
                // 할인 규칙 적용
                const applicableDiscounts = applyCombo(newOptions);
                if (applicableDiscounts) {
                    // 결합 할인 적용
                    if (applicableDiscounts.discounts) {
                        applicableDiscounts.discounts.forEach(discount => {
                            if (discount.type === 'family') {
                                newOptions['family_discount'] = {
                                    label: `패밀리 할인 - ${discount.label}`,
                                    price: -discount.amount,
                                    type: 'monthly',
                                    isDiscount: true
                                };
                            } else if (discount.type === 'monthly') {
                                const serviceName = discount.service === 'tv' ? 'TV' : 
                                                discount.service === 'phone' ? '전화' : 
                                                discount.service === 'cctv' ? '기가아이즈' : 
                                                discount.service;
                                newOptions[`${discount.service}_discount`] = {
                                    label: `${serviceName} 할인`,
                                    price: -discount.amount,
                                    type: 'monthly',
                                    isDiscount: true
                                };
                            }
                        });
                    }

                    // 혜택 적용
                    if (applicableDiscounts.benefits) {
                        // 자동 적용된 혜택은 extraBenefit으로 직접 설정하지 않음
                        // 대신 혜택 정보만 저장
                        newOptions.autoBenefits = {
                            giftCard: applicableDiscounts.benefits.giftCard,
                            cash: applicableDiscounts.benefits.cash
                        };
                    }
                }

                // 카드할인 규칙 적용
                const cardDiscounts = applyCardDiscountRules(newOptions);
                if (cardDiscounts) {
                    cardDiscounts.forEach(discount => {
                        newOptions[discount.service] = {
                            label: discount.label,
                            price: -discount.amount,
                            type: 'card'
                        };
                    });
                }
            }

            return newOptions;
        });

        if (option.label !== '직접입력') {
            handleCloseDialog(true);
        }
    };

    const handleManualInputChange = (key, field, value) => {
        setManualInputs((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const handleHighorderQuantityChange = (index, value) => {
        const numericQuantity = parseInt(value, 10) || 1;
        setSelectedOptions(prev => {
            if (!Array.isArray(prev.highorder)) return prev;
            const updatedArr = prev.highorder.map((item, idx) => {
                if (idx !== index) return item;
                let price = item.unitPrice * numericQuantity;
                const unitOTP = item.oneTimePayment ? (item.oneTimePayment / (item.quantity || 1)) : 0;
                const otp = unitOTP * numericQuantity;
                const newItem = {
                    ...item,
                    quantity: numericQuantity,
                    price,
                    oneTimePayment: otp,
                    benefits: {
                        ...(item.benefits || {}),
                        oneTimePayment: otp
                    }
                };
                return newItem;
            });
            return { ...prev, highorder: updatedArr };
        });
    };

    const removeHighorderOption = (index) => {
            setSelectedOptions(prev => {
            if (!Array.isArray(prev.highorder)) return prev;
            const updatedArr = prev.highorder.filter((_, i) => i !== index);
            const clone = { ...prev };
            if (updatedArr.length) clone.highorder = updatedArr; else delete clone.highorder;
            return clone;
            });
    };

    const handlePosQuantityChange = (index, value) => {
        const numericQuantity = parseInt(value) || 1;
        setSelectedOptions(prev => ({
            ...prev,
            pos: Array.isArray(prev.pos) ? prev.pos.map((item, idx) => {
                if (idx !== index) return item;
                const unitOTP = item.oneTimePayment ? (item.oneTimePayment / (item.quantity || 1)) : 0;
                const otp = unitOTP * numericQuantity;
                return {
                    ...item,
                    quantity: numericQuantity,
                    price: item.unitPrice * numericQuantity,
                    oneTimePayment: otp,
                    benefits: {
                        ...(item.benefits || {}),
                        oneTimePayment: otp
                    }
                };
            }) : []
        }));
    };

    const removePosOption = (index) => {
        setSelectedOptions(prev => ({
            ...prev,
            pos: Array.isArray(prev.pos) ? prev.pos.filter((_, i) => i !== index) : []
        }));
    };

    /* -------------------------------------------------
        Domain calculation (single source of truth)
    ------------------------------------------------- */
    const estimateData = useEstimateData(selectedOptions, services, isCardDiscountApplied, productBenefitRows, comboRulesData, benefitRuleRows, { isBusiness, excludedCombos });
    const { originalTotal, productBenefits: productBenefitsCalc, extraBenefits: benefitResults, comboDiscount } = estimateData;

    // 할인금액(직접+결합)
    const discountAmount = Object.entries(selectedOptions)
        .filter(([key, opt]) => {
            const service = services.find(s => s.key === key);
            return service?.isDiscount && opt?.price < 0;
        })
        .filter(([key, opt]) => opt.price !== 0)
        .reduce((sum, [key, opt]) => sum + opt.price, 0)
        + (applyCombo(selectedOptions).discounts.length > 0
            ? -applyCombo(selectedOptions).discounts.reduce((sum, discount) => sum + discount.amount, 0)
            : 0);
    // 카드할인
    const cardDiscountAmount = isCardDiscountApplied
        ? services
            .filter(service => 
                service.isCardDiscount && 
                selectedOptions[service.key]?.label !== '선택 안함' && 
                selectedOptions[service.key]?.price > 0
            )
            .reduce((sum, service) => sum + (selectedOptions[service.key]?.price || 0), 0)
        : 0;
    // 최종금액
    const finalTotal = originalTotal + discountAmount - cardDiscountAmount;

    const handleSave = async () => {
        setIsStickerEditMode(false);
        await new Promise(resolve => setTimeout(resolve, 100)); // DOM 반영 대기
        if (!estimateTitle.trim()) {
            setSnackbarMessage('견적서 제목을 입력해주세요.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            setIsStickerEditMode(true);
            return;
        }

        try {
            // 동일 제목 체크
            let exists = false;
            try {
                const res = await fetchQuotes();
                const list = res.data || res;
                exists = list.some(q => (q.title || '').trim() === estimateTitle.trim());
            } catch (_) {}
            if (exists) {
                // 덮어쓰기 다이얼로그 오픈 (캡처/데이터 준비)
                const estimateElement = document.getElementById('estimate');
                await new Promise(resolve => setTimeout(resolve, 500));
                const canvas = await html2canvas(estimateElement, {
                    useCORS: true,
                    allowTaint: true,
                    scrollY: -window.scrollY,
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.getElementById('estimate');
                        if (clonedElement) {
                            clonedElement.style.transform = 'none';
                            clonedElement.style.width = '794px';
                            clonedElement.style.height = '1123px';
                        }
                    }
                });
                const imageData = canvas.toDataURL('image/png', 1.0);
                const now = new Date();
                const dateStr = now.toLocaleDateString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\. /g, '.').replace(/\.$/, '');
                const fileName = `[${dateStr}]-${estimateTitle.replace(/\s+/g, '')}`;
                setOverwriteDialog({
                    open: true,
                    data: {
                        fileName,
                        imageData
                    }
                });
                setIsStickerEditMode(true);
                return;
            }

            setSnackbarMessage('견적서를 저장하는 중입니다...');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            const estimateElement = document.getElementById('estimate');
            const canvas = await html2canvas(estimateElement, {
                useCORS: true,
                allowTaint: true,
                scrollY: -window.scrollY,
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('estimate');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.width = '794px';
                        clonedElement.style.height = '1123px';
                    }
                }
            });
            const imageData = canvas.toDataURL('image/png', 1.0);
            const now = new Date();
            const dateStr = now.toLocaleDateString('ko-KR', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\. /g, '.').replace(/\.$/, '');
            const fileName = `[${dateStr}]-${estimateTitle.replace(/\s+/g, '')}`;
            const payload2 = { ...buildEstimatePayload(), date: formattedDate };
            const res2 = await saveQuote(payload2);
            if (res2) {
                const link = document.createElement('a');
                link.download = `${fileName}.png`;
                link.href = imageData;
                link.click();
                setSnackbarMessage('견적서가 성공적으로 저장되었습니다.');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                if (recentEstimatesRef.current?.loadAllFiles) {
                    await recentEstimatesRef.current.loadAllFiles();
                }
            } else {
                throw new Error('저장 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error saving estimate:', error);
            setSnackbarMessage('견적서 저장 중 오류가 발생했습니다.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
        setIsStickerEditMode(true);
    };

    // 견적서 불러오기 함수
    const loadEstimate = (savedEstimate) => {
        setEstimateTitle(savedEstimate.title);
        setCustomerName(savedEstimate.customerName || '');
        setSelectedOptions(savedEstimate.selectedOptions || {});
        setManualInputs(savedEstimate.manualInputs || {});
        if (savedEstimate.selectedExtraBenefit) {
            setSelectedExtraBenefit(savedEstimate.selectedExtraBenefit);
            setCustomGiftCard(savedEstimate.customGiftCard || 0);
            setCustomCash(savedEstimate.customCash || 0);
        }
        setIsCardDiscountApplied(savedEstimate.isCardDiscountApplied || false);
        setIsBusiness(!!savedEstimate.isBusiness);
        setShowSticker(savedEstimate.showSticker !== undefined ? savedEstimate.showSticker : true);
        setStickerText(savedEstimate.stickerText || defaultMemo || MEMO_FALLBACK);
        setExcludedCombos(savedEstimate.excludedCombos || []);
        
        // 날짜 처리: 파일명에서 날짜 추출
        const dateMatch = savedEstimate.fileName?.match(/\[(\d{2}\.\d{2}\.\d{2})\]/);
        const extractedDate = dateMatch ? `[${dateMatch[1]}]` : null;
        
        // 저장된 날짜가 있으면 사용하고, 없으면 파일명에서 추출한 날짜 사용
        setEstimateDate(extractedDate || savedEstimate.date || formattedDate);
    };

    // Benefits 렌더링 함수 수정: 수량 곱한 금액을 반환하도록 개선
    const renderBenefits = (benefits, color,  quantity = 1, price = 0) => {
        if (!benefits) return null;
        const { oneTimePayment } = benefits;
        // 일시납 금액이 정의되지 않은 경우 표시하지 않음
        if (typeof oneTimePayment === 'undefined' || oneTimePayment === null) {
            return null;
        }
        const total = oneTimePayment; // already total amount
        return (
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: '280px',
                gap: 2,
                ml: 1.8,
            }}>
                <Typography sx={{ 
                    textAlign: 'right',
                    fontFamily: 'GmarketSansBold',
                    color: color,
                    fontSize: '0.85rem',
                    pr: 5.5
                }}>
                    {total ? `${total.toLocaleString()}원` : ''}
                </Typography>
            </Box>
        );
    };

    const handleTitleChange = useCallback((e) => {
        const newTitle = e.target.value;
        setEstimateTitle(newTitle);
        // 입력 중에는 에러 메시지 초기화
        if (titleError) {
            setTitleError('');
        }
    }, [titleError]);

    const handleTitleBlur = async () => {
        const trimmedTitle = estimateTitle.trim();
        
        if (!trimmedTitle) {
            setTitleError('');
            return;
        }

        try {
            const res = await fetchQuotes();
            const list = res.data || res;
            const exists = list.some((q) => (q.title || '').trim() === trimmedTitle);
            setTitleError(exists ? '이미 존재하는 견적서 제목입니다.' : '');
        } catch {
            // ignore
        }
    };

    // 스크롤 이벤트 핸들러
    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollTop;
        const totalHeight = e.target.scrollHeight - e.target.clientHeight;
        const scrollPercentage = (scrollPosition / totalHeight) * 100;
        setShowScrollTop(scrollPercentage >= 70);
    };

    // 맨 위로 스크롤
    const scrollToTop = () => {
        const contentElement = document.querySelector('[role="main"]');
        if (contentElement) {
            contentElement.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // 직접입력 저장 처리 함수 추가
    const handleSaveManualInput = () => {
        if (activeServiceKey === 'highorder') {
            if (manualInputs[activeServiceKey]) {
                const newHighorder = {
                    label: manualInputs[activeServiceKey].label || '직접입력',
                    price: manualInputs[activeServiceKey].price || 0,
                    quantity: 1,
                    unitPrice: manualInputs[activeServiceKey].price || 0,
                    benefits: {
                        oneTimePayment: manualInputs[activeServiceKey].oneTimePayment || 0
                    }
                };
                
                setSelectedOptions(prev => ({
                    ...prev,
                    highorder: [...(Array.isArray(prev.highorder) ? prev.highorder : []), newHighorder]
                }));
            }
            handleCloseDialog(true);
            return;
        }
        
        // POS 저장 로직 추가 (직접입력 지원)
        if (activeServiceKey === 'pos') {
            if (manualInputs['pos'] && manualInputs['pos'].label) {
                const newPos = {
                    label: manualInputs['pos'].label,
                    price: manualInputs['pos'].price || 0,
                    quantity: 1,
                    unitPrice: manualInputs['pos'].price || 0,
                    oneTimePayment: manualInputs['pos'].oneTimePayment || 0,
                    benefits: {
                        oneTimePayment: manualInputs['pos'].oneTimePayment || 0
                    }
                };
                setSelectedOptions(prev => ({
                    ...prev,
                    pos: [...(Array.isArray(prev.pos) ? prev.pos : []), newPos]
                }));
            }
            handleCloseDialog(true);
            return;
        }
        
        if (activeServiceKey === 'extraBenefit') {
            // 직접입력한 추가 혜택만 저장
            if (selectedOptions[activeServiceKey]?.label === '직접입력') {
                setSelectedOptions(prev => ({
                    ...prev,
                    extraBenefit: {
                        label: '직접입력 혜택',
                        title: manualInputs[activeServiceKey]?.label || '추가 혜택',
                        price: 0,
                        benefits: {
                            giftCard: customGiftCard || 0,
                            cash: customCash || 0
                        }
                    }
                }));
            }
            handleCloseDialog(true);
            return;
        }
        
        if (activeServiceKey && manualInputs[activeServiceKey]) {
            const service = services.find(s => s.key === activeServiceKey);
            const isDiscount = service?.isDiscount || false;
            const price = manualInputs[activeServiceKey].price || 0;
            const oneTimePayment = manualInputs[activeServiceKey].oneTimePayment || 0;
            
            setSelectedOptions(prev => ({
                ...prev,
                [activeServiceKey]: {
                    label: manualInputs[activeServiceKey].label || '직접입력',
                    price: isDiscount ? -Math.abs(price) : price,
                    quantity: 1,
                    unitPrice: price,
                    isDiscount,
                    benefits: {
                        oneTimePayment: oneTimePayment
                    }
                }
            }));

            handleCloseDialog(true);
        }
    };

    const getExtraBenefits = () => extraBenefitsList;

    const calculateTotalGiftCard = () => {
        return Object.values(selectedOptions).reduce((sum, opt) => sum + (opt?.benefits?.giftCard || 0), 0);
    };

    const calculateTotalCash = () => {
        return Object.values(selectedOptions).reduce((sum, opt) => sum + (opt?.benefits?.cash || 0), 0);
    };

    // 견적서 초기화 함수
    const handleReset = async () => {
        setEstimateTitle('');
        setCustomerName('');
        setSelectedOptions({});
        setManualInputs({});
        setCctvSubFilter({ category: '', countIndex: null });
        setAccessSubFilter({ category: '', countIndex: null });
        setQuantities({});
        setEstimateDate(formattedDate);
        // 최신 메모를 다시 불러와 적용 (설정 페이지에서 변경되었을 수 있음)
        try {
            const res = await fetchMemo();
            const memoText = res.data?.defaultMemo ?? defaultMemo;
            setDefaultMemo(memoText);
            setStickerText(memoText || MEMO_FALLBACK);
        } catch (_) {
            setStickerText(defaultMemo || MEMO_FALLBACK);
        }
    };

    // 덮어쓰기 다이얼로그의 덮어쓰기 버튼 onClick 수정
    const saveEstimateWithData = async (fileName, imageData) => {
        try {
            setSnackbarMessage('견적서를 덮어쓰는 중입니다...');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            const payload2 = { ...buildEstimatePayload(), date: formattedDate };
            const res2 = await saveQuote(payload2);
            if (res2) {
                const link = document.createElement('a');
                link.download = `${fileName}.png`;
                link.href = imageData;
                link.click();
                setSnackbarMessage('견적서가 성공적으로 덮어쓰기 저장되었습니다.');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                if (recentEstimatesRef.current?.loadAllFiles) {
                    await recentEstimatesRef.current.loadAllFiles();
                }
            } else {
                throw new Error('저장 중 오류가 발생했습니다.');
            }
        } catch (error) {
            setSnackbarMessage('견적서 덮어쓰기 저장 중 오류가 발생했습니다.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const hasCombo = (Object.entries(selectedOptions).some(([key, opt]) => {
        const service = services.find(s => s.key === key);
        if (!service?.isDiscount) return false;
        if (Array.isArray(opt)) {
            return opt.some(o => o?.price < 0);
        }
        return opt?.price < 0;
    }) || applyCombo(selectedOptions).discounts.length > 0);

    const hasCard = services.some(service => 
        service.isCardDiscount && 
        selectedOptions[service.key]?.label !== '선택 안함' && 
        selectedOptions[service.key]?.price > 0
    );

    // 계산 결과는 estimateData에서 이미 추출됨

    const handlePickerClose = (shouldSave = false, selectedArr = []) => {
        if (shouldSave) {
            // custom label 처리: 직접입력일 때 customLabel이 있으면 label에 복사
            const normalized = selectedArr.map((item, itemIdx) => {
                const svc = services.find(s=>s.key===activeServiceKey);
                const optMeta = svc?.options?.find(o=>o.label===item.label) || {};
                const qty = item.quantity || 1;
                // Determine per-unit price:
                //  1) Prefer item.unitPrice if present (already corrected in picker)
                //  2) If label embeds quantity (e.g., "4대("), divide optMeta.price by that qty
                //  3) Fallback to optMeta.price or item.price
                const embeddedQtyMatch = /^\s*(\d+)대\(/.exec(item.label || '');
                const embeddedQty = embeddedQtyMatch ? parseInt(embeddedQtyMatch[1], 10) : 1;
                const unitFromEmbedded = embeddedQty > 1 ? (optMeta.price || 0) / embeddedQty : (optMeta.price || 0);
                const unit = item.unitPrice || (embeddedQtyMatch ? unitFromEmbedded : (optMeta.price || item.price || 0));
                // optMeta.oneTimePayment 가 존재하면 그것이 단가로 확정
                // 없으면 item.oneTimePayment 를 단가로 간주
                const unitOTP = (typeof optMeta.oneTimePayment === 'number' && !isNaN(optMeta.oneTimePayment))
                    ? optMeta.oneTimePayment // per-unit defined in meta
                    : ((item.oneTimePayment || 0) / Math.max(qty, 1)); // derive per-unit from stored total

                // Merge price tables from picker item and meta
                const tables = [item.prices || {}, optMeta.prices || {}];
                let matched;
                for (const t of tables) {
                    if (t && (t[qty] !== undefined || t[String(qty)] !== undefined)) {
                        matched = t[qty] !== undefined ? t[qty] : t[String(qty)];
                        break;
                    }
                }

                const basePrice = optMeta.price || item.basePrice || unit || 0;
                let priceCalc;
                
                // 직접입력의 경우 item.price를 직접 사용 (basePrice 계산 무시)
                if (item.label === '직접입력' || item.customLabel) {
                    priceCalc = item.price || 0;
                } else if (matched !== undefined) {
                    priceCalc = matched;
                } else if (basePrice !== 0) {
                    priceCalc = basePrice * qty;
                } else {
                    // 입력된 금액 그대로 사용 (manual_discount 커스텀 등)
                    priceCalc = item.price || 0;
                }
                // 할인 서비스인 경우, 금액을 음수로 변환하여 저장
                if (svc?.isDiscount && priceCalc > 0) {
                    priceCalc = -Math.abs(priceCalc);
                }
                const otpCalc = unitOTP * qty;
                let result = {
                    ...item,
                    unitPrice: unit,
                    price: priceCalc,
                    oneTimePayment: otpCalc,
                    benefits: {
                        ...(item.benefits || {}),
                        oneTimePayment: otpCalc
                    }
                };
                // 혜택 서비스인 경우, giftCard/cash 복사
                if (svc?.isBenefit) {
                    const gifts = (item.benefits || {});
                    result = {
                        ...result,
                        benefits: {
                           giftCard: gifts.giftCard ?? optMeta.giftCard ?? 0,
                           cash: gifts.cash ?? optMeta.cash ?? 0
                        },
                        price: 0 // 혜택은 가격 0
                    };
                }
                // label 은 항상 원본(직접입력)으로 유지하고, 화면 표시는 customLabel 로 처리한다.
                // customLabel 만 별도 보존해 두면 나중에 UI 렌더링 시 opt.customLabel || opt.label 로 출력된다.
                return result;
            });

            const activeSvc = services.find(s=>s.key===activeServiceKey);
            const isMulti = activeSvc?.meta?.multiSelect || activeSvc?.key === 'manual_discount';
            
            setSelectedOptions(prev => ({
                ...prev,
                [activeServiceKey]: isMulti ? normalized : (normalized[0] || { label: '선택 안함' })
            }));
        }
        setOpenPicker(false);
        setActiveServiceKey(null);
    };

    // load memo.json once
    useEffect(() => {
        fetchMemo().then(res => {
            if (res.data && res.data.defaultMemo) {
                setDefaultMemo(res.data.defaultMemo);
                setStickerText(res.data.defaultMemo);
            }
        }).catch(()=>{});
    }, []);

    // reset stickerText to current default when user toggles 리셋
    useEffect(() => {
        setStickerText(defaultMemo || MEMO_FALLBACK);
    }, [defaultMemo]);

    // set default date once on mount
    useEffect(()=>{
        if(!estimateDate){
           setEstimateDate(formattedDate);
        }
    },[]);

    // 저장용 최신 계산 payload 생성
    const buildEstimatePayload = () => {
        const latestEstimateData = EstimateService.calculate(
            selectedOptions,
            services,
            isCardDiscountApplied,
            productBenefitRows,
            comboRulesData,
            benefitRuleRows,
            { isBusiness, excludedCombos }
        );

        return {
            title: estimateTitle,
            customerName,
            date: estimateDate,
            timestamp: Date.now(),
            selectedOptions,
            manualInputs,
            selectedExtraBenefit,
            customGiftCard,
            customCash,
            isCardDiscountApplied,
            isBusiness,
            showSticker,
            stickerText,
            excludedCombos,
            ...latestEstimateData
        };
    };

    // Calculate chip keys via bundleBenefits definition
    const appliedRuleKeys = (benefitResults.productBenefits||[])
        .filter(b=>b.service==='benefit' && b.key)
        .map(b=>b.key);
    const activeBundles = (bundleBenefits||[]).filter(b=>
        (b.ruleKeys||[]).some(k => appliedRuleKeys.includes(k))
    );

    // selected services (for chip filtering)
    const selectedServiceKeys = Object.entries(selectedOptions)
        .filter(([, sel]) => {
            if (Array.isArray(sel)) return sel.length > 0;
            return sel && sel.label && sel.label !== '선택 안함';
        })
        .map(([key]) => key);

    const genieoneKeys = Array.from(new Set(activeBundles.flatMap(b => b.serviceKeys || []))).filter(k => selectedServiceKeys.includes(k));

    // 선택 옵션이 변경되어 할인 조건이 달라지면, 제외 목록에서도 유효하지 않은 키를 제거
    useEffect(() => {
        const currentApplicable = applyComboRules(selectedOptions, comboRulesData || {}, []).discounts.map(d => d.key);
        setExcludedCombos(prev => prev.filter(key => currentApplicable.includes(key)));
    }, [selectedOptions, comboRulesData]);

    return (
        <Box sx={{ display: 'flex', maxWidth: '100vw', height: '100vh', position: 'relative' }}>
            {/* Top-left control bar */}
            <Box sx={{ position:'fixed', top:12, left:12, zIndex:100, display:'flex', gap:1 }}>
                <Button size="small" variant="outlined" onClick={handleLogout}>로그아웃</Button>
                <Button size="small" variant="contained" color="secondary" onClick={()=> navigate('/admin')}>관리자</Button>
            </Box>

            <Box 
                sx={{ 
                    flex: 1,
                    width: sidebarOpen ? 'calc(100vw - 300px)' : '100vw',
                    // padding: '20px',
                    marginTop: '10px',
                    pt: 0,
                    pb: '20px',
                    // pl: '20px',
                    overflowY: 'auto',
                    transition: 'all 0.3s ease-in-out'
                }}
                onScroll={handleScroll}
                role="main"
            >
                {/* 토글 버튼들 */}
                <IconButton
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    sx={{
                        position: 'fixed',
                        right: sidebarOpen ? '320px' : '20px',
                        top: '40%',
                        transform: 'translateY(-50%)',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            backgroundColor: '#1565c0'
                        },
                        width: '40px',
                        height: '40px',
                        zIndex: 1200
                    }}
                >
                    {sidebarOpen ? <ChevronRightIcon /> : <MenuIcon />}
                </IconButton>

                {showScrollTop && (
                    <IconButton
                        onClick={scrollToTop}
                        sx={{
                            position: 'fixed',
                            right: sidebarOpen ? '320px' : '20px',
                            bottom: '80px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                backgroundColor: '#1565c0'
                            },
                            width: '40px',
                            height: '40px',
                            opacity: 0.8,
                            zIndex: 1200
                        }}
                    >
                        <KeyboardArrowUpIcon />
                    </IconButton>
                )}

                {/* 견적서 제목(Title) 섹션 */}
                <Typography 
                    variant="h4" 
                    align="center"
                    sx={{
                        mt: 4,
                        mb: 6,
                        fontWeight: 'bold'
                    }}
                >
                    항목별 견적 선택
                </Typography>

                {/* 견적서 제목 섹션 */}
                <EstimateTitleSection 
                    estimateTitle={estimateTitle} 
                    handleTitleChange={handleTitleChange}
                    handleTitleBlur={handleTitleBlur}
                    titleError={titleError} 
                    resetEstimate={handleReset} 
                />

                {/* 상품 선택 섹션 (Generic) */}
                <GenericSection
                    title="상품 선택"
                    serviceKeys={services.filter(s => !s.isDiscount && !s.isCardDiscount && s.group !== 'benefit').map(s => s.key)}
                    selectedOptions={selectedOptions}
                    onOpenDialog={handleOpenDialog}
                    services={services}
                    extraHeader={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ fontSize: '0.95rem', mr: 1 }}>스티커 메모</Typography>
                            <Switch checked={showSticker} onChange={e => setShowSticker(e.target.checked)} />
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <Typography sx={{ fontSize: '0.95rem', mr: 1, color: !isBusiness ? '#1976d2' : '#888' }}>사업자</Typography>
                                <Switch
                                    checked={isBusiness}
                                    onChange={e => setIsBusiness(e.target.checked)}
                                    color="primary"
                                />
                                <Typography sx={{ fontSize: '0.95rem', ml: 0.5, color: isBusiness ? '#1976d2' : '#888' }}>법인</Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<SearchIcon />}
                                onClick={() => window.open('https://help.kt.com/serviceinfo/SearchHomePhone.do')}
                                sx={{ height: '36px' }}
                            >
                                서비스 가능지역 확인
                            </Button>
                        </Box>
                    }
                />

                {/* 결합할인 섹션 -> GenericSection */}
                <GenericSection
                    title="결합할인 선택"
                    serviceKeys={services.filter(s => s.isDiscount).map(s => s.key)}
                    selectedOptions={selectedOptions} 
                    onOpenDialog={handleOpenDialog}
                    services={services}
                    buttonColor="secondary"
                />

                {/* 적용된 결합할인 Chips */}
                {(() => {
                    const allApplicable = applyComboRules(selectedOptions, comboRulesData || {}, []).discounts;
                    if (!allApplicable.length) return null;

                    return (
                      <Box sx={{
                        display:'flex',gap:1,flexWrap:'wrap',my:2,
                        maxWidth: '800px',
                        mx: 'auto'
                      }}>
                        {allApplicable.map(d=> {
                          const isExcluded = excludedCombos.includes(d.key);
                          return (
                            <Chip
                              key={d.key}
                              label={d.label}
                              color={isExcluded ? 'default' : 'secondary'}
                              deleteIcon={isExcluded ? <CheckCircleOutlineIcon /> : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDelete={() => {
                                  setExcludedCombos(prev => {
                                      if (isExcluded) {
                                          return prev.filter(k => k !== d.key);
                                      }
                                      return [...prev, d.key];
                                  });
                              }}
                              sx={{ cursor:'default' }}
                            />
                          );
                        })}
                      </Box>
                    );
                })()}

                {/* 추가 혜택 섹션 -> GenericSection */}
                <GenericSection
                    title="추가 혜택 선택"
                    serviceKeys={services.filter(s => s.group === 'benefit').map(s => s.key)}
                    selectedOptions={selectedOptions} 
                    onOpenDialog={handleOpenDialog}
                    services={services}
                    buttonColor="warning"
                />

                {/* 카드할인 섹션 -> GenericSection with toggle */}
                <GenericSection
                    title="카드할인 선택"
                    serviceKeys={services.filter(s => s.isCardDiscount).map(s => s.key)}
                    selectedOptions={selectedOptions} 
                    onOpenDialog={handleOpenDialog}
                    services={services}
                    buttonColor="info"
                    extraHeader={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: isCardDiscountApplied ? '#27b0ae' : '#666', width: '40px', textAlign: 'center' }}>
                                {isCardDiscountApplied ? '적용' : '미적용'}
                            </Typography>
                            <Switch
                                checked={isCardDiscountApplied}
                                onChange={e => setIsCardDiscountApplied(e.target.checked)}
                                color="primary"
                            />
                        </Box>
                    }
                />

                {/* 견적서 */}
                <Paper 
                    id="estimate" 
                    elevation={3} 
                    sx={{ 
                        p: 6, 
                        pt: 4,
                        mt: 4, 
                        width: '794px', 
                        height: '1123px', 
                        mx: 'auto', 
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        // backgroundImage: 'url("/static/images/background.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {/* 성함 입력란 - 왼쪽 상단 */}
                    <Box sx={{ position: 'absolute', left: 54, top: 44, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '0.8rem', mb: 0.2 }}>
                            {estimateDate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontFamily: 'GmarketSansMedium', fontSize: '0.8rem', mr: 1 }}>고객&nbsp;:&nbsp;</Typography>
                            <input
                                type="text"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                style={{
                                    fontFamily: 'GmarketSansMedium',
                                    border: 'none',
                                    borderBottom: '1.5px solid black',
                                    borderRadius: 0,
                                    padding: '0px 8px',
                                    fontSize: '0.8rem',
                                    width: 80,
                                    outline: 'none',
                                    background: 'transparent'
                                }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, maxWidth: '210mm', width: '100%', mx: 'auto' }}>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <Box component="img"
                                src="./static/images/main_logo.png"
                                alt="KT지니원 [고객맞춤설계]"
                                sx={{
                                    height: '30px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                }}
                            />
                        </Box>
                        <Typography variant="subtitle1" sx={{ 
                            fontFamily: 'GmarketSansMedium',
                            color: 'black',
                            fontSize: '1rem',
                            textAlign: 'right',
                        }}>
                            [3년약정, 부가세별도]
                                    </Typography>
                        
                        {/* KT 상품 그룹 */}
                        {(() => {
                            const hasAnyBenefits = (comboDiscount?.benefits?.giftCard || comboDiscount?.benefits?.cash || 
                                                productBenefitsCalc.giftCard || productBenefitsCalc.cash ||
                                                benefitResults.giftCard || benefitResults.cash);

                            return (
                                <>
                                    {(['internet', 'wifi', 'tv', 'phone', 'servingbot'].some(key => {
                                        const val = selectedOptions[key];
                                        return Array.isArray(val) ? val.length > 0 : (val?.label && val.label !== '선택 안함');
                                    }) || (Array.isArray(selectedOptions.highorder) ? selectedOptions.highorder.length > 0 : false)) && (
                                        <KTProductGroup 
                                            selectedOptions={selectedOptions}
                                            services={services}
                                            renderBenefits={renderBenefits}
                                            isBusiness={isBusiness}
                                            benefitResults={benefitResults}
                                            activeBundles={activeBundles}
                                            selectedServiceKeys={selectedServiceKeys}
                                            genieoneKeys={genieoneKeys}
                                        />
                                    )}

                                    {/* KT 텔레캅 상품 그룹 */}
                                    {['cctv', 'access', 'security'].some(key => {
                                        const val = selectedOptions[key];
                                        return Array.isArray(val) ? val.length > 0 : (val?.label && val.label !== '선택 안함');
                                    }) && (
                                        <KTTelecopGroup
                                            selectedOptions={selectedOptions}
                                            services={services}
                                            renderBenefits={renderBenefits}
                                            isBusiness={isBusiness}
                                            benefitResults={benefitResults}
                                            activeBundles={activeBundles}
                                            selectedServiceKeys={selectedServiceKeys}
                                            genieoneKeys={genieoneKeys}
                                        />
                                    )}
                                    
                                    {/* 정수기/포스기 및 기타 pos_water 그룹 상품 */}
                                    {(() => {
                                        // pos_water 그룹에 속한 서비스들 중 하나라도 선택된 것이 있는지 확인
                                        const hasPosWater = services
                                            .filter(svc => svc.group === 'pos_water')
                                            .some(svc => {
                                                const val = selectedOptions[svc.key];
                                                return Array.isArray(val)
                                                    ? val.length > 0
                                                    : val && val.label && val.label !== '선택 안함';
                                            });

                                        if (!hasPosWater) return null;

                                        return (
                                        <PosWaterGroup
                                            selectedOptions={selectedOptions}
                                            services={services}
                                            renderBenefits={renderBenefits}
                                            isBusiness={isBusiness}
                                            benefitResults={benefitResults}
                                            activeBundles={activeBundles}
                                            selectedServiceKeys={selectedServiceKeys}
                                            genieoneKeys={genieoneKeys}
                                        />
                                        );
                                    })()}

                                    {/* 결합할인 또는 카드할인 */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, width: '100%' }}>
                                        {/* 왼쪽: 결합할인 또는 카드할인 */}
                                        <Box sx={{ flex: '1', maxWidth: '48%' }}>
                                            {hasCombo ? (
                                                <ComboDiscountBox 
                                                    selectedOptions={selectedOptions} 
                                                    services={services} 
                                                    applyComboRules={applyCombo} 
                                                />
                                            ) : hasCard ? (
                                                <CardDiscountBox 
                                                    selectedOptions={selectedOptions} 
                                                    services={services} 
                                                    isCardDiscountApplied={isCardDiscountApplied} 
                                                />
                                            ) : null}
                                        </Box>
                                        {/* 오른쪽: 카드할인 (결합할인도 있을 때만) */}
                                        <Box sx={{ flex: '1', maxWidth: '50%' }}>
                                            {hasCombo && hasCard ? (
                                                <CardDiscountBox 
                                                    selectedOptions={selectedOptions} 
                                                    services={services} 
                                                    isCardDiscountApplied={isCardDiscountApplied} 
                                                />
                                            ) : null}
                                        </Box>
                                    </Box>

                                    {/* 혜택 그룹 */}
                                    {hasAnyBenefits ? (
                                        <BenefitBox 
                                            productBenefits={productBenefitsCalc}
                                            benefitResults={benefitResults}
                                            selectedOptions={selectedOptions}
                                            isBusiness={isBusiness}
                                            activeBundles={activeBundles}
                                            selectedServiceKeys={selectedServiceKeys}
                                            genieoneKeys={genieoneKeys}
                                            services={services}
                                        />
                                    ) : null}
                                </>
                            );
                        })()}

                        {/* 최종 금액 */}
                        <TotalAmountBox 
                            originalTotal={originalTotal}
                            selectedOptions={selectedOptions}
                            services={services}
                            isCardDiscountApplied={isCardDiscountApplied}
                            applyComboRules={applyCombo}
                        />

                    </Box>
                    {/* 스티커 메모 영역 */}
                    {showSticker && (
                        <Box sx={{ 
                            position: 'absolute',
                            left: 32,
                            bottom: 68,
                            zIndex: 2000,
                            minWidth: '89%',
                            maxWidth: '89%',
                        }}>
                            {isStickerEditMode ? (
                                <textarea
                                    ref={stickerRef}
                                    value={stickerText}
                                    onChange={e => {
                                        setStickerText(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    style={{
                                        width: '100%',
                                        minHeight: 110,
                                        border: 'none',
                                        background: 'transparent',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: '0.86rem',
                                        overflow: 'hidden',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        whiteSpace: 'pre-line',
                                        fontFamily: 'inherit',
                                        fontSize: '0.86rem',
                                        minHeight: 110,
                                        padding: 8,
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {stickerText}
                                </div>
                            )}
                            </Box>
                    )}
                </Paper>

                {/* 이미지로 저장 버튼 */}
                <Box display="flex" justifyContent="center" mt={4}>
                    <Button 
                        variant="contained" 
                        onClick={handleSave} 
                        size="large"
                        disabled={!estimateTitle.trim()}
                    >
                        이미지로 저장
                    </Button>
                </Box>

                {/* 새로운 Picker for multiSelect services */}
                <OptionPickerDialog
                    open={openPicker}
                    onClose={handlePickerClose}
                    service={services.find(s => s.key === activeServiceKey)}
                    initial={pickerInitial}
                />
                {/* 기존 단일 선택 다이얼로그 유지 */}
                <OptionDialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    activeServiceKey={activeServiceKey}
                    selectedOptions={selectedOptions}
                    manualInputs={manualInputs}
                    onOptionChange={handleOptionChange}
                    onManualInputChange={handleManualInputChange}
                    onHighorderQuantityChange={handleHighorderQuantityChange}
                    removeHighorderOption={removeHighorderOption}
                    onPosQuantityChange={handlePosQuantityChange}
                    removePosOption={removePosOption}
                    extraBenefits={extraBenefitsList}
                    customGiftCard={customGiftCard}
                    setCustomGiftCard={setCustomGiftCard}
                    customCash={customCash}
                    setCustomCash={setCustomCash}
                    services={services}
                    onSave={handleSaveManualInput}
                />
            </Box>
            
            {/* 최근 견적서 사이드바 */}
            <Box
                sx={{
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    width: '300px',
                    height: '100%',
                    bgcolor: 'background.paper',
                    borderLeft: '1px solid #eee',
                    zIndex: 1100,
                    overflowY: 'hidden',
                    boxShadow: '-4px 0 8px rgba(0,0,0,0.1)',
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease-in-out',
                    visibility: sidebarOpen ? 'visible' : 'hidden'
                }}
            >
                <RecentEstimates 
                    ref={recentEstimatesRef}
                    onLoadEstimate={loadEstimate} 
                />
            </Box>
            
            {/* Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />

            {/* 덮어쓰기 확인 다이얼로그 */}
            <Dialog
                open={overwriteDialog.open}
                onClose={() => setOverwriteDialog({ open: false, data: null })}
                PaperProps={{
                    sx: {
                        width: '400px',
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle>견적서 덮어쓰기</DialogTitle>
                <DialogContent sx={{ px: 2, py: 3 }}>
                    <DialogContentText sx={{ whiteSpace: 'pre-line', textAlign: 'left', px: 1 }}>
                        {'같은 제목의 견적서가 이미 존재합니다.\n덮어쓰시겠습니까?'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 2 }}>
                    <Button onClick={() => setOverwriteDialog({ open: false, data: null })}>
                        취소
                    </Button>
                    <Button
                        onClick={async () => {
                            if (overwriteDialog.data) {
                                const { fileName, imageData } = overwriteDialog.data;
                                await saveEstimateWithData(fileName, imageData);
                                setOverwriteDialog({ open: false, data: null });
                            }
                        }}
                        color="primary"
                        variant="contained"
                    >
                        덮어쓰기
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 