import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Props
 * open: boolean
 * table: { [qty: string|number]: { giftCard:number, cash:number } }
 * onSave(tbl) => void  (called when user presses save)
 * onClose()          (called when dialog closed without save)
 */
export default function BenefitQuantityDialog({ open, table = {}, onSave, onClose }) {
  const [tbl, setTbl] = useState(table);

  // when parent changes table while closed, sync state on open
  React.useEffect(() => {
    if (open) setTbl(table);
  }, [open, table]);

  const handleFieldChange = (qty, field, value) => {
    setTbl((prev) => {
      const next = { ...prev };
      const row = { ...(next[qty] || { giftCard: 0, cash: 0 }) };
      row[field] = parseInt(value, 10) || 0;
      next[qty] = row;
      return next;
    });
  };

  const handleQtyChange = (oldQty, newQty) => {
    setTbl((prev) => {
      const next = { ...prev };
      const row = next[oldQty];
      delete next[oldQty];
      next[newQty] = row;
      return next;
    });
  };

  const removeRow = (qty) => {
    setTbl((prev) => {
      const next = { ...prev };
      delete next[qty];
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>수량별 혜택 편집</DialogTitle>
      <DialogContent sx={{ pt:2 }}>
        {Object.entries(tbl).map(([qty, { giftCard = 0, cash = 0 }]) => (
          <Box key={qty} sx={{ display:'flex', alignItems:'center', gap:1, mb:2, mt:2 }}>
            <TextField label="수량" type="number" size="small" sx={{ width:80 }} value={qty}
              onChange={(e)=> handleQtyChange(qty, e.target.value)} />
            <TextField label="상품권" type="number" size="small" sx={{ width:120 }} value={giftCard}
              onChange={(e)=> handleFieldChange(qty,'giftCard', e.target.value)} />
            <TextField label="현금" type="number" size="small" sx={{ width:120 }} value={cash}
              onChange={(e)=> handleFieldChange(qty,'cash', e.target.value)} />
            <IconButton onClick={()=> removeRow(qty)}><DeleteIcon/></IconButton>
          </Box>
        ))}
        <Button variant="outlined" onClick={()=> setTbl((prev)=>{
          // find next qty
          const maxQty = Math.max(0, ...Object.keys(prev).map(q=>parseInt(q,10)||0));
          return { ...prev, [maxQty+1]: { giftCard:0, cash:0 } };
        })}>행 추가</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={()=> onSave(tbl)}>저장</Button>
      </DialogActions>
    </Dialog>
  );
} 