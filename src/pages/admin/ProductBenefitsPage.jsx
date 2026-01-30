import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchProductBenefits, addProductBenefit, updateProductBenefit, deleteProductBenefit, fetchServices } from '../../api.js';
import BenefitQuantityDialog from './BenefitQuantityDialog.jsx';

export default function ProductBenefitsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    serviceKey: '',
    option: '',
    giftCard: 0,
    cash: 0,
    multiplyByQuantity: true,
    excludeGiftCardIfBusiness: false,
    excludeCashIfBusiness: false
  });
  const [services, setServices] = useState([]);
  const [filterKey, setFilterKey] = useState('');
  const [benefitDlg, setBenefitDlg] = useState({ open: false, rowId: null, table: {} });

  const load = () => {
    setLoading(true);
    fetchProductBenefits().then((res) => {
      setRows(res.data);
      setLoading(false);
    });
  };
  useEffect(load, []);

  // load services list for dropdowns
  useEffect(() => {
    fetchServices().then(res => setServices(res.data||[]));
  }, []);

  const toNumber = (v) => Number(String(v).replace(/,/g, '')) || 0;

  const processRowUpdate = async (newRow) => {
    try {
      const rowClean = {
        ...newRow,
        giftCard: toNumber(newRow.giftCard),
        cash: toNumber(newRow.cash),
        multiplyByQuantity: newRow.multiplyByQuantity !== false,
        excludeGiftCardIfBusiness: !!newRow.excludeGiftCardIfBusiness,
        excludeCashIfBusiness: !!newRow.excludeCashIfBusiness
      };
      await updateProductBenefit(rowClean.id, rowClean);
      return rowClean;
    } catch (e) {
      throw e;
    } finally {
      load();
    }
  };

  const handleRowUpdateError = (err) => {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  };

  const handleAdd = async () => {
    await addProductBenefit(newItem);
    setOpenAdd(false);
    setNewItem({ serviceKey: '', option: '', giftCard: 0, cash: 0, multiplyByQuantity: true, excludeGiftCardIfBusiness: false, excludeCashIfBusiness: false });
    load();
  };

  const filteredRows = filterKey ? rows.filter(r => r.serviceKey === filterKey) : rows;

  const saveQtyBenefits = (tbl) => {
    // update row in state and send to server
    setRows(prev=> prev.map(r=> (r.id===benefitDlg.rowId? { ...r, perQuantity: tbl }: r)));
    const target = rows.find(r=>r.id===benefitDlg.rowId);
    if(target){
      const clean={ ...target, perQuantity: tbl };
      updateProductBenefit(clean.id, clean).then(load);
    }
    setBenefitDlg({ open:false,rowId:null,table:{} });
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          기본 혜택
        </Typography>
      </Box>

      {/* 상단 우측의 새 기본 혜택 버튼 */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          새 기본 혜택
        </Button>
      </Box>

      {/* 필터 버튼 영역 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap:'wrap' }}>
        <Button variant={filterKey===''?'contained':'outlined'} size="small" onClick={()=>setFilterKey('')}>전체</Button>
        {services.map(svc=> (
          <Button 
            key={svc.key}
            variant={filterKey===svc.key?'contained':'outlined'}
            size="small"
            onClick={()=>setFilterKey(svc.key)}
          >
            {svc.name}
          </Button>
        ))}
      </Box>
      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={filteredRows}
          columns={[
            { field: 'id', headerName: 'ID', width: 70, headerAlign: 'right', align: 'right' },
            { field: 'serviceKey', headerName: '서비스 Key', width: 140, editable: true },
            { field: 'option', headerName: '옵션 라벨', width: 220, editable: true },
            { field: 'giftCard', headerName: '상품권', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
            { field: 'cash', headerName: '현금', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
            { field: 'multiplyByQuantity', headerName: '수량 곱', width: 100, type:'boolean', editable:true },
            { field: 'excludeGiftCardIfBusiness', headerName: '법인-상품권X', width: 130, type:'boolean', editable:true },
            { field: 'excludeCashIfBusiness', headerName: '법인-현금X', width: 130, type:'boolean', editable:true },
            { field: 'qtyBenefits', headerName: '수량별 혜택', width: 140, renderCell:(params)=>{
                const row=params.row;
                const count= row.perQuantity? Object.keys(row.perQuantity).length:0;
                return <Button size="small" variant="outlined" onClick={()=> setBenefitDlg({ open:true, rowId:row.id, table: row.perQuantity||{} })}>{count? `편집(${count})`:'추가'}</Button>;
            }},
            {
              field: 'actions',
              headerName: '',
              width: 120,
              renderCell: (params) => (
                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
                  <Button
                    size="small"
                    color="error"
                    onClick={async () => {
                      if (window.confirm('삭제하시겠습니까?')) {
                        await deleteProductBenefit(params.row.id);
                        load();
                      }
                    }}
                  >
                    삭제
                  </Button>
                </Box>
              )
            }
          ]}
          loading={loading}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleRowUpdateError}
          disableColumnResize={false}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          pageSizeOptions={[50]}
          sx={{ minWidth: 900 }}
        />
      </Box>

      {/* Add dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} PaperProps={{ sx: { width: 420 } }}>
        <DialogTitle>새 기본 혜택</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* 서비스 키 선택 */}
          <TextField fullWidth select label="서비스" value={newItem.serviceKey} onChange={(e)=>{
              const key=e.target.value;
              setNewItem(s=>({...s, serviceKey:key, option:''}));
          }} sx={{ mt: 1 }}>
            {services.map(svc=> (
              <MenuItem key={svc.key} value={svc.key}>{svc.name} ({svc.key})</MenuItem>
            ))}
          </TextField>

          {/* 옵션 라벨 선택: 해당 서비스 옵션에서 divider 제외 */}
          <TextField fullWidth select label="옵션 라벨" value={newItem.option} onChange={(e)=> setNewItem(s=>({...s, option:e.target.value}))} disabled={!newItem.serviceKey}>
            {(services.find(s=>s.key===newItem.serviceKey)?.options||[])
              .filter(opt=> !opt.type || opt.type!=='divider')
              .map(opt=> (
                <MenuItem key={opt.label} value={opt.label}>{opt.label}</MenuItem>
              ))}
          </TextField>
          <TextField fullWidth label="상품권" type="number" value={newItem.giftCard} onChange={(e) => setNewItem((s) => ({ ...s, giftCard: parseInt(e.target.value)||0 }))} />
          <TextField fullWidth label="현금" type="number" value={newItem.cash} onChange={(e) => setNewItem((s) => ({ ...s, cash: parseInt(e.target.value)||0 }))} />
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Typography>수량 곱하기</Typography>
            <input type="checkbox" checked={newItem.multiplyByQuantity} onChange={e=> setNewItem(s=>({...s, multiplyByQuantity:e.target.checked}))} />
          </Box>
          {/* 법인 제외 플래그 */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Typography>법인: 상품권 제외</Typography>
            <input type="checkbox" checked={newItem.excludeGiftCardIfBusiness} onChange={e=> setNewItem(s=>({...s, excludeGiftCardIfBusiness:e.target.checked}))} />
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Typography>법인: 현금 제외</Typography>
            <input type="checkbox" checked={newItem.excludeCashIfBusiness} onChange={e=> setNewItem(s=>({...s, excludeCashIfBusiness:e.target.checked}))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>취소</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newItem.serviceKey || !newItem.option}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quantity Benefit dialog */}
      <BenefitQuantityDialog
        open={benefitDlg.open}
        table={benefitDlg.table}
        onSave={saveQtyBenefits}
        onClose={()=> setBenefitDlg({ open:false,rowId:null,table:{} })}
      />
    </Box>
  );
} 