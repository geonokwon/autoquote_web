import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Radio,
  TextField,
  Box,
  Typography,
  Divider,
  FormControlLabel,
  RadioGroup,
  InputAdornment
} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

/**
 * Generic picker dialog that supports both single and multi selection plus quantity.
 * Props:
 *  open: boolean
 *  onClose(save:boolean, selectedArray?)
 *  service: service object from constants/services
 *  initial: currently selected array for that service ( [] by default )
 */
export default function OptionPickerDialog({ open, onClose, service, initial = [] }) {
  if (!service) return null;
  const meta = service.meta || { multiSelect: false, maxQuantity: 1 };
  const isMulti = meta.multiSelect || service.key === 'manual_discount' || service.key==='extraBenefit';

  const [selected, setSelected] = useState([]);

  // convert initial to map for easy access
  useEffect(() => {
    setSelected(initial);
  }, [initial]);

  const toggleOption = (option) => {
    // If label contains "n대(" pattern, treat option.price as aggregated and derive unit price.
    const embeddedMatch = /^(\d+)대\(/.exec(option.label);
    const derivedUnit = embeddedMatch ? (option.price || 0) / parseInt(embeddedMatch[1], 10) : option.price;

    if (isMulti) {
      const exists = selected.find((o) => o.label === option.label);
      if (exists) {
        setSelected(selected.filter((o) => o.label !== option.label));
      } else {
        setSelected([
          ...selected,
          {
            label: option.label,
            quantity: 1,
            unitPrice: derivedUnit,
            basePrice: option.price,
            prices: option.prices || {},
            price: (option.prices && option.prices['1'] !== undefined)
                    ? option.prices['1']
                    : (option.price ?? 0),
            oneTimePayment: option.oneTimePayment || 0
          }
        ]);
      }
    } else {
      setSelected([
        {
          label: option.label,
          quantity: 1,
          unitPrice: derivedUnit,
          basePrice: option.price,
          prices: option.prices || {},
          price: (option.prices && option.prices['1'] !== undefined)
                  ? option.prices['1']
                  : (option.price ?? 0),
          oneTimePayment: option.oneTimePayment || 0
        }
      ]);
    }
  };

  const changeQuantity = (optionLabel, qty) => {
    setSelected(
      selected.map((o) => {
        if (o.label !== optionLabel) return o;
        const tbl = o.prices || {};
        const base = o.basePrice || o.unitPrice || 0;
        const val = (tbl[qty] !== undefined) ? tbl[qty] : (tbl[String(qty)] !== undefined ? tbl[String(qty)] : undefined);
        const newPrice = val !== undefined ? val : base * qty;
        return { ...o, quantity: qty, price: newPrice };
      })
    );
  };

  const handleSave = () => {
    let toSave = selected;
    // extraBenefit(추가혜택)에서 직접입력 행은 label에 customLabel(인풋값) 복사
    if (service.key === 'extraBenefit') {
      toSave = selected.map(sel => {
        if (sel.label === '직접입력' && sel.customLabel) {
          return { ...sel, label: sel.customLabel };
        }
        return sel;
      });
    }
    onClose(true, toSave);
  };

  const handleCancel = () => onClose(false);

  // Add empty direct discount row (for manual_discount)
  const addEmptyRow = () => {
    setSelected(sel=>[
        ...sel,
        { tmpId: Date.now(), label:'직접입력', quantity:1, unitPrice:0, basePrice:0, prices:{}, price:0, oneTimePayment:0, customLabel:'', benefits:{giftCard:0, cash:0} }
    ]);
  };

  // group options by divider title
  const groups = [];
  let current = { title: '', options: [] };
  service.options.forEach((opt) => {
    if (opt.type === 'divider') {
      if (current.options.length) groups.push(current);
      current = { title: opt.label, options: [] };
    } else {
      current.options.push(opt);
    } 
  });
  if (current.options.length) groups.push(current);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>{service.name} 선택</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {groups.map((group, gi) => (
          <Box key={gi} sx={{ mb: 3 }}>
            {group.title && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }} color="text.secondary">
                  {group.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </>
            )}
            <RadioGroup
              {...(!isMulti ? { value: (selected[0]?.label || '') } : {})}
              onChange={() => {}}
              sx={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridTemplateRows: 'repeat(4, auto)',
                gap: 2
              }}
            >
              {group.options.map((opt, idx) => {
                // 선택 배열에 동일 라벨이 있으면 체크.  
                // 과거 버전에서 label을 customLabel 로 덮어쓴 데이터도 고려해, 
                // opt.label 이 '직접입력' 인 경우 customLabel 이 존재해도 true 로 본다.
                const exists = selected.find((o) => {
                  if (o.label === opt.label) return true;
                  if (opt.label === '직접입력') {
                    // tmpId(새로 추가된 행) 또는 customLabel 이 있으면 직접입력으로 간주
                    return o.tmpId !== undefined || !!o.customLabel;
                  }
                  return false;
                });
                const control = isMulti ? (
                  <Checkbox
                    checked={!!exists}
                    onChange={() => toggleOption(opt)}
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<RadioButtonCheckedIcon />}
                  />
                ) : (
                  <Radio checked={!!exists} onChange={() => toggleOption(opt)} />
                );
                return (
                  <FormControlLabel
                    key={opt.label}
                    value={opt.label}
                    control={control}
                    label={
                      <Typography sx={{ fontSize: 14 }}>
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
                              <span style={{ display: 'block', fontSize: 12, color: '#888' }}>
                                (월 {monthly.toLocaleString()}원)
                              </span>
                            );
                          }
                          if (otp > 0) {
                            return (
                              <span style={{ display: 'block', fontSize: 12, color: '#888' }}>
                                (일시납 {otp.toLocaleString()}원)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </Typography>
                    }
                    sx={{
                      m: 0,
                      gridColumn: Math.floor(idx / 4) + 1,
                      gridRow: (idx % 4) + 1
                    }}
                  />
                );
              })}
            </RadioGroup>
          </Box>
        ))}

        {/* quantity editors */}
        {selected.length > 0 && meta.maxQuantity > 1 && (
          <Box sx={{ mt: 3 }}>
            {selected.map((sel) => (
              <Box key={sel.label} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography sx={{ width: 300, whiteSpace:'nowrap' }}>{sel.customLabel || sel.label}</Typography>
                <TextField
                  label="수량"
                  type="number"
                  size="small"
                  sx={{ width: 120 }}
                  inputProps={{ min: 1, max: meta.maxQuantity }}
                  onFocus={(e)=> e.target.select()}
                  value={sel.quantity === '' ? '' : sel.quantity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if(raw==='') {
                      changeQuantity(sel.label, '');
                      return;
                    }
                    let v = parseInt(raw, 10) || 0;
                    if (v < 0) v = 0;
                    if (v > meta.maxQuantity) v = meta.maxQuantity;
                    changeQuantity(sel.label, v);
                  }}
                  onBlur={(e)=>{
                    const raw=e.target.value;
                    if(raw==='') changeQuantity(sel.label,1);
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* 직접할인(멀티) 커스텀 필드 */}
        {(service.key==='manual_discount' || service.key==='extraBenefit') && selected.length > 0 && (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selected.map((sel, idx) => (
              <Box key={sel.tmpId || idx} sx={{ display:'flex', alignItems:'center', gap:2 }}>
                {(()=>{
                    const isCustom = sel.tmpId!==undefined || !!sel.customLabel || (service.key==='manual_discount' && sel.label==='직접입력');
                    if(service.key==='extraBenefit' && sel.label==='소상공인 혜택' && !sel.tmpId) return true;
                    if(service.key==='manual_discount' && !isCustom) return true;
                    return false;
                  })() ? (
                  <>
                    <Typography sx={{ flex:1 }}>{sel.customLabel || sel.label}</Typography>
                    {service.key==='manual_discount' && (
                      <Typography sx={{ width:120,textAlign:'right',pr:1 }}>{sel.price?.toLocaleString()}원</Typography>
                    )}
                  </>
                ) : (
                <>
                <TextField
                  label={service.key==='extraBenefit'?"혜택명":"항목 이름"}
                  value={sel.customLabel || ''}
                  onChange={(e)=>{
                    const v=e.target.value;
                    setSelected(arr=>arr.map((s,i)=>i===idx?{...s, customLabel:v}:s));
                  }}
                  sx={{ flex:2 }}
                />
                {service.key==='extraBenefit'? (
                  <>
                    <TextField label="상품권" value={(sel.benefits?.giftCard||0).toLocaleString()} onChange={(e)=>{
                       const num=parseInt(e.target.value.replace(/,/g,''),10)||0;
                       setSelected(arr=>arr.map((s,i)=>i===idx?{...s, benefits:{...s.benefits, giftCard:num}}:s));
                    }} InputProps={{endAdornment:<InputAdornment position="end">원</InputAdornment>}} sx={{width:120}}/>
                    <TextField label="현금" value={(sel.benefits?.cash||0).toLocaleString()} onChange={(e)=>{
                       const num=parseInt(e.target.value.replace(/,/g,''),10)||0;
                       setSelected(arr=>arr.map((s,i)=>i===idx?{...s, benefits:{...s.benefits, cash:num}}:s));
                    }} InputProps={{endAdornment:<InputAdornment position="end">원</InputAdornment>}} sx={{width:120}}/>
                  </>
                ) : (
                  <TextField
                    label="할인 금액"
                    value={(sel.price||0).toLocaleString()}
                    onChange={(e)=>{
                      const num=parseInt(e.target.value.replace(/,/g,''),10)||0;
                      setSelected(arr=>arr.map((s,i)=>i===idx?{...s, price:num}:s));
                    }}
                    InputProps={{endAdornment:<InputAdornment position="end">원</InputAdornment>}}
                    sx={{ width:160 }}
                  />
                )}
                <Button color="error" onClick={()=>{
                  setSelected(arr=>arr.filter((_,i)=>i!==idx));
                }}>삭제</Button>
                </>) }
              </Box>
            ))}
          </Box>
        )}

        {/* 직접입력 커스텀 필드 (비할인·비혜택 서비스용) – 다중 선택 시에도 노출 */}
        {service.key!=='manual_discount' && service.key!=='extraBenefit' && selected.some(s => s.label === '직접입력') && (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selected.filter(s=>s.label==='직접입력').map((sel, idx) => (
              <React.Fragment key={idx}>
                <TextField
                  label="상품명"
                  value={sel.customLabel || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    changeQuantity(sel.label, sel.quantity); // keep quantity
                    setSelected(arr => arr.map(s => s.label==='직접입력'?{...s, customLabel:v}:s));
                  }}
                  fullWidth
                />
                <TextField
                  label="월 이용료"
                  value={(sel.price || 0).toLocaleString()}
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/,/g,''),10)||0;
                    setSelected(arr => arr.map(s => s.label==='직접입력'?{...s, price:num}:s));
                  }}
                  InputProps={{endAdornment:<InputAdornment position="end">원</InputAdornment>}}
                  fullWidth
                />
                {!service.isDiscount && (
                  <TextField
                    label="일시납 금액"
                    value={(sel.oneTimePayment || 0).toLocaleString()}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/,/g,''),10)||0;
                      setSelected(arr => arr.map(s => s.label==='직접입력'?{...s, oneTimePayment:num}:s));
                    }}
                    InputProps={{endAdornment:<InputAdornment position="end">원</InputAdornment>}}
                    fullWidth
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {(service.key==='manual_discount' || service.key==='extraBenefit') && (
          <Button onClick={addEmptyRow} color="primary">행 추가</Button>
        )}
        <Button onClick={() => onClose(true, [])} color="error">선택 해제</Button>
        <Button onClick={handleCancel} color="inherit">취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={selected.length === 0}>저장</Button>
      </DialogActions>
    </Dialog>
  );
} 