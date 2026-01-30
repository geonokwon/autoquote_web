import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Box, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { updateServiceOptionName } from '../../api.js';

// Props: open, onClose(save:boolean), service, onSave(updatedOptions)
export default function ServiceOptionsDialog({ open, onClose, service, onSave }) {
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [priceDlg, setPriceDlg] = useState({ open: false, rowId: null, table: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      const mapped = (service.options || []).map((opt, idx) => ({ id: idx + 1, order: opt.order ?? idx, ...opt }));
      setRows(mapped);
      // Store original rows to detect label changes
      setOriginalRows(mapped.map(r => ({ ...r })));
    }
  }, [service]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: prev.length ? prev[prev.length - 1].id + 1 : 1, order: prev.length, label: '', price: 0 }]);
  };

  // auto scroll when row count increases
  const prevCountRef = useRef(rows.length);
  useEffect(() => {
    if (rows.length > prevCountRef.current) {
      const scroller = document.querySelector('.MuiDataGrid-virtualScroller');
      if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
    prevCountRef.current = rows.length;
  }, [rows.length]);

  const processRowUpdate = (newRow) => {
    try {
      setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
      return newRow;
    } catch (e) {
      throw e;
    }
  };

  const lastMoveRef = useRef(0);
  const moveRow = (rowId, direction) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 150) return; // debounce 150ms
    lastMoveRef.current = now;

    setRows(prev => {
      const idx = prev.findIndex(r => r.id === rowId);
      const target = idx + (direction === 'up' ? -1 : 1);
      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      // swap positions
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;

      // update order values to maintain consistency
      next[idx].order = idx;
      next[target].order = target;
      return next;
    });
  };

  const handleRowUpdateError = (err) => {
    console.error(err);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Detect label changes (only for non-divider options)
      const labelChanges = [];
      rows.forEach(row => {
        const original = originalRows.find(o => o.id === row.id);
        if (original && original.label !== row.label && row.type !== 'divider') {
          labelChanges.push({
            oldLabel: original.label,
            newLabel: row.label
          });
        }
      });
      
      // Apply cascade updates for each label change
      if (labelChanges.length > 0 && service?.id) {
        for (const change of labelChanges) {
          try {
            await updateServiceOptionName(service.id, change.oldLabel, change.newLabel);
            console.log(`Updated "${change.oldLabel}" to "${change.newLabel}" across all rules`);
          } catch (error) {
            console.error(`Failed to update option name:`, error);
            alert(`옵션명 "${change.oldLabel}" → "${change.newLabel}" 업데이트 중 오류가 발생했습니다.`);
          }
        }
      }
      
      // Prepare final options array
      const newOptions = [...rows]
        .sort((a,b)=> (a.order??0) - (b.order??0))
        .map(({ id, ...rest }) => rest);
      
      // Call parent's onSave callback
      onSave(newOptions);
      
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const openPriceEditor = (row) => {
    setPriceDlg({ open: true, rowId: row.id, table: row.prices || {} });
  };

  const savePrices = (tableObj) => {
    setRows((prev) => prev.map((r) => (r.id === priceDlg.rowId ? { ...r, prices: tableObj } : r)));
    setPriceDlg({ open: false, rowId: null, table: {} });
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, editable: false },
    { field: 'type', headerName: '구분', width: 100, editable: true },
    { field: 'label', headerName: '라벨', width: 220, editable: true },
    { field: 'price', headerName: '월 가격', width: 120, type: 'number', editable: true },
    { field: 'oneTimePayment', headerName: '일시납', width: 120, type: 'number', editable: true },
    {
      field: 'actions',
      headerName: '',
      width: 190,
      renderCell: (params)=>{
        const {row}=params;
        const isDivider = row.type==='divider';
        return (
          <Box sx={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:0.5 }}>
            <IconButton size="small" onClick={()=>moveRow(row.id,'up')}><ArrowUpwardIcon fontSize="inherit"/></IconButton>
            <IconButton size="small" onClick={()=>moveRow(row.id,'down')}><ArrowDownwardIcon fontSize="inherit"/></IconButton>
            {isDivider ? (
              // 자리 유지를 위한 투명 placeholder
              <Box sx={{ width: 104, height: 24 }} />
            ) : (
              <>
                <Button size="small" variant="outlined" onClick={()=>openPriceEditor(row)}>편집</Button>
                <IconButton size="small" sx={{ ml: 1 }} color="error" onClick={()=>{
                  if(window.confirm('이 행을 삭제하시겠습니까?')){
                    setRows(prev=> prev.filter(r=> r.id!==row.id));
                  }
                }}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{service?.name} 옵션 편집</DialogTitle>
      <DialogContent sx={{ maxHeight:'70vh', overflowY:'auto' }}>
        <Box sx={{ width:'100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            rowHeight={38}
            getRowClassName={(params)=> params.indexRelativeToCurrentPage %2 ===0 ? 'even' : 'odd'}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleRowUpdateError}
            disableColumnResize={false}
            initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
            pageSizeOptions={[50]}
            sx={{
              '.MuiDataGrid-columnHeaders, & .MuiDataGrid-footerContainer': { backgroundColor: '#f5f5f5' },
              '& .MuiDataGrid-row.even': { backgroundColor: '#fafafa' },
              '& .MuiDataGrid-row.even.Mui-selected': { backgroundColor: '#e0f7fa !important' },
              '& .MuiDataGrid-row.Mui-selected': { backgroundColor: '#e0f2f1 !important' },
              '& .MuiDataGrid-row.Mui-row--editing': { backgroundColor: '#fffde7' },
              '& .MuiDataGrid-cell': { borderRight: '1px solid #e0e0e0' },
              '& .MuiDataGrid-row': { borderBottom: '1px solid #e0e0e0' },
              '& .MuiDataGrid-virtualScroller': { pb: 2.4 }
            }}
          />
        </Box>
        <Button onClick={addRow} sx={{ mt: 1 }} variant="outlined">
          행 추가
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>취소</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>

      {/* 가격 테이블 편집 다이얼로그 */}
      <Dialog open={priceDlg.open} onClose={()=>setPriceDlg({ open:false,rowId:null,table:{} })}>
        <DialogTitle>수량별 가격 편집</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          {Object.entries(priceDlg.table).map(([qty, price])=> (
            <Box key={qty} sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
              <TextField label="수량" type="number" size="small" sx={{ mt:1, width:80 }} value={qty} onChange={(e)=>{
                const newQty=e.target.value;
                setPriceDlg(p=>{
                  const tbl={...p.table};
                  const val=tbl[qty];
                  delete tbl[qty];
                  tbl[newQty]=val; return {...p, table: tbl};
                });
              }}/>
              <TextField label="가격" type="number" size="small" sx={{ mt:1, width:120 }} value={price===''? '': price} onChange={(e)=>{
                const raw=e.target.value;
                if(raw==='') { setPriceDlg(p=>({ ...p, table:{...p.table, [qty]: ''} })); return; }
                const v=parseInt(raw,10)||0;
                setPriceDlg(p=>({ ...p, table:{...p.table, [qty]: v} }));
              }} onBlur={(e)=>{
                if(e.target.value==='') setPriceDlg(p=>({ ...p, table:{...p.table, [qty]: 0} }));
              }}/>
              <IconButton onClick={()=> setPriceDlg(p=>{ const t={...p.table}; delete t[qty]; return {...p, table:t};})}><DeleteIcon/></IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={()=> setPriceDlg(p=>{
            const max = Math.max(0, ...Object.keys(p.table).map(k=>parseInt(k,10)||0));
            return { ...p, table:{ ...p.table, [max+1]: 0 } };
          })}>행 추가</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setPriceDlg({ open:false,rowId:null,table:{} })}>취소</Button>
          <Button variant="contained" onClick={()=> savePrices(priceDlg.table)}>저장</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 