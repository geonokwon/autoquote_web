import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Autocomplete, Chip, Box } from '@mui/material';

/**
 * BundleBenefitDialog
 * props:
 *   open        : boolean
 *   bundle      : { id?, title, serviceKeys[], ruleKeys[] } | null (for edit)
 *   services    : array<{ key, name, label }>
 *   benefitRules: array<{ key, title }>
 *   onSave(obj) : callback
 *   onClose()   : close only
 */
export default function BundleBenefitDialog({ open, bundle, services = [], benefitRules = [], onSave, onClose }) {
    const [title, setTitle] = useState('');
    const [selectedSvc, setSelectedSvc] = useState([]); // keys array
    const [selectedRules, setSelectedRules] = useState([]); // keys array
    const [bgColor, setBgColor] = useState('#ffe5e5');

    // sync when opening
    useEffect(() => {
        if (open) {
        setTitle(bundle?.title || '');
        setSelectedSvc(bundle?.serviceKeys || []);
        setSelectedRules(bundle?.ruleKeys || []);
        setBgColor(bundle?.bgColor || '#ffe5e5');
        }
    }, [open, bundle]);

    const handleSave = () => {
        if (!title.trim()) return;
        const obj = {
        ...(bundle?.id ? { id: bundle.id } : {}),
        title: title.trim(),
        serviceKeys: selectedSvc,
        ruleKeys: selectedRules,
        bgColor: bgColor || '#ffe5e5'
        };
        onSave(obj);
    };

    // Build options
    const svcOptions = services.map((s) => ({ key: s.key, label: `${s.name || s.key} (${s.label || s.key})` }));
    const ruleOptions = benefitRules.map((r) => ({ key: r.key, label: `${r.title} (${r.key})` }));

    const findSvcOption = (key) => svcOptions.find((o) => o.key === key) || { key, label: key };
    const findRuleOption = (key) => ruleOptions.find((o) => o.key === key) || { key, label: key };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{bundle ? '묶음 혜택 수정' : '새 묶음 혜택'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField sx={{ mt: 2 }} label="제목" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* 색상 선택 */}
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
            <TextField
                type="color"
                label="배경색"
                value={bgColor}
                onChange={e=> setBgColor(e.target.value)}
                sx={{ width:120 }}
            />
            <Box sx={{ width:40, height:24, bgcolor:bgColor, border:'1px solid #ccc', borderRadius:1 }} />
            <Button size="small" onClick={()=> setBgColor('#ffe5e5')}>기본값</Button>
            </Box>

            <Autocomplete
            multiple
            options={svcOptions}
            getOptionLabel={(o) => o.label}
            value={selectedSvc.map(findSvcOption)}
            onChange={(_, val) => setSelectedSvc(val.map((v) => v.key))}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                <Chip label={option.key} {...getTagProps({ index })} />
                ))
            }
            renderInput={(params) => <TextField {...params} label="서비스 keys" placeholder="선택" />}
            />

            <Autocomplete
            multiple
            options={ruleOptions}
            getOptionLabel={(o) => o.label}
            value={selectedRules.map(findRuleOption)}
            onChange={(_, val) => setSelectedRules(val.map((v) => v.key))}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                <Chip label={option.key} {...getTagProps({ index })} />
                ))
            }
            renderInput={(params) => <TextField {...params} label="혜택 ruleKeys" placeholder="선택" />}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>취소</Button>
            <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>
            저장
            </Button>
        </DialogActions>
        </Dialog>
    );
} 