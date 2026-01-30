import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchBenefitRules, updateBenefitRule, deleteBenefitRule, addBenefitRule, fetchServices } from '../../api.js';
import BenefitRuleDialog from './BenefitRuleDialog.jsx';

export default function BenefitRulesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewJson, setViewJson] = useState({ open: false, data: null });
  const [dlg, setDlg] = useState({ open: false, rule: null });
  const [services, setServices] = useState([]);

  const load = () => {
    setLoading(true);
    fetchBenefitRules().then((res) => {
      setRows(res.data);
      setLoading(false);
    });
  };
  useEffect(load, []);

  useEffect(()=>{ fetchServices().then(res=> setServices(res.data||[])); },[]);

  const processRowUpdate = async (newRow) => {
    try {
      const { id, key, title, giftCard, cash } = newRow;
      await updateBenefitRule(id, { key, title, giftCard, cash });
      return newRow;
    } catch (e) {
      throw e;
    }
  };

  const handleRowUpdateError = (err) => {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  };

  const ruleKeys = rows.map(r=>r.key);

  const handleSaveRule = async (obj) => {
    if(obj.id){
      await updateBenefitRule(obj.id,obj);
    }else{
      await addBenefitRule(obj);
    }
    setDlg({ open:false, rule:null });
    load();
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          결합 혜택
        </Typography>
      </Box>

      <Box sx={{ mb:2, display:'flex', justifyContent:'flex-end' }}>
        <Button variant="contained" onClick={()=> setDlg({open:true, rule:null})}>새 혜택 규칙</Button>
      </Box>

      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field: 'id', headerName: 'ID', width: 70, headerAlign: 'right', align: 'right' },
            { field: 'key', headerName: 'Key', width: 200, editable: true },
            { field: 'title', headerName: '제목', width: 220, editable: true },
            { field: 'giftCard', headerName: '상품권', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
            { field: 'cash', headerName: '현금', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
            {
              field: 'actions',
              headerName: '',
              width: 200,
              renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
                  <Button size="small" variant="outlined" onClick={()=> setDlg({ open:true, rule: params.row })}>수정</Button>
                  <Button size="small" color="error" onClick={async()=>{
                      if(window.confirm('삭제하시겠습니까?')){
                        await deleteBenefitRule(params.row.id);
                        load();
                      }}}>삭제</Button>
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
          sx={{ minWidth: 1000 }}
        />
      </Box>

      {/* JSON dialog read-only */}
      <Dialog open={viewJson.open} onClose={() => setViewJson({ open: false, data: null })} maxWidth="md" fullWidth>
        <DialogTitle>규칙 상세 JSON (편집은 추후 지원)</DialogTitle>
        <DialogContent sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {viewJson.data ? JSON.stringify(viewJson.data, null, 2) : ''}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewJson({ open: false, data: null })}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* Benefit rule dialog */}
      <BenefitRuleDialog
        open={dlg.open}
        rule={dlg.rule}
        services={services}
        ruleKeys={ruleKeys}
        onClose={()=> setDlg({ open:false, rule:null })}
        onSave={handleSaveRule}
      />
    </Box>
  );
} 