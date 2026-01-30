import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchBundleBenefits, addBundleBenefit, updateBundleBenefit, deleteBundleBenefit, fetchBenefitRules, fetchServices } from '../../api.js';
import BundleBenefitDialog from './BundleBenefitDialog.jsx';

export default function BundleBenefitsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [openAdd, setOpenAdd] = useState(false);
  const [dlg, setDlg] = useState({ open:false, bundle:null });
  const [benefitRulesList, setBenefitRulesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  const load = () => {
    setLoading(true);
    fetchBundleBenefits().then((res) => {
      const list = (res.data||[]).map(r=>({
        ...r,
        svcCnt: (r.serviceKeys||[]).length,
        ruleCnt: (r.ruleKeys||[]).length
      }));
      setRows(list);
      setLoading(false);
    });
  };
  useEffect(load, []);

  useEffect(() => {
    fetchBenefitRules().then(res => setBenefitRulesList(res.data || []));
    fetchServices().then(res => setServicesList(res.data || []));
  }, []);

  const processRowUpdate = async (newRow) => {
    try {
      const clean = {
        ...newRow,
        serviceKeys: (''+newRow.serviceKeys).split(',').map(s=>s.trim()).filter(Boolean),
        ruleKeys: (''+newRow.ruleKeys).split(',').map(s=>s.trim()).filter(Boolean)
      };
      await updateBundleBenefit(clean.id, clean);
      return clean;
    } catch (e) {
      throw e;
    }
  };

  const handleRowUpdateError = (e) => {
    console.error(e);
    alert('저장 오류');
  };

  const handleSaveBundle = async (obj) => {
    if(obj.id){
      await updateBundleBenefit(obj.id, obj);
    }else{
      await addBundleBenefit(obj);
    }
    setDlg({ open:false, bundle:null });
    load();
  };

  return (
    <Box>
      <Box sx={{ mb:3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight:'bold' }}>묶음 혜택</Typography>
      </Box>
      <Box sx={{ mb:2, display:'flex', justifyContent:'flex-end' }}>
        <Button variant="contained" onClick={()=> setDlg({ open:true, bundle:null })}>새 묶음 혜택</Button>
      </Box>
      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field:'id', headerName:'ID', width:70, headerAlign:'right', align:'right'},
            { field:'title', headerName:'제목', width:220, editable:true},
            { field:'svcCnt', headerName:'서비스수', width:100, editable:false },
            { field:'ruleCnt', headerName:'규칙수', width:100, editable:false },
            { field:'actions', headerName:'', width:200, renderCell:(params)=>(
              <Box sx={{ display:'flex', gap:1, width:'100%', height:'100%', alignItems:'center', justifyContent:'center' }}>
                <Button size="small" variant="outlined" onClick={()=> setDlg({ open:true, bundle:params.row })}>편집</Button>
                <Button color="error" size="small" onClick={async()=>{
                  if(window.confirm('삭제?')){ await deleteBundleBenefit(params.row.id); load(); }
                }}>삭제</Button>
              </Box>
            )}
          ]}
          loading={loading}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleRowUpdateError}
          disableColumnResize={false}
          initialState={{ pagination:{ paginationModel:{ pageSize:50 }}}}
          pageSizeOptions={[50]}
          sx={{ minWidth:1000 }}
        />
      </Box>

      {/* Bundle dialog */}
      <BundleBenefitDialog
        open={dlg.open}
        bundle={dlg.bundle}
        services={servicesList}
        benefitRules={benefitRulesList}
        onSave={handleSaveBundle}
        onClose={()=> setDlg({ open:false, bundle:null })}
      />
    </Box>
  );
} 