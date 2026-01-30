import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchComboRules, updateComboRule, addComboRule, deleteComboRule, fetchServices } from '../../api.js';
import ComboRuleDialog from './ComboRuleDialog.jsx';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function ComboRulesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [openDlg, setOpenDlg] = useState({ open: false, rule: null });
  const ruleKeys = rows.map(r=>r.key);

  // helper: server -> grid row (add display-only fields)
  const mapFromServer = (row) => ({
    ...row,
    priority: row.priority ?? 9999,
    requiredList: (row.conditions?.required || []).join(', '),
    combineList: (row.canCombineWith || []).join(', ')
  });

  const mapToServer = (row) => {
    const { requiredList, combineList, ...rest } = row;
    return rest;
  };

  // load from server
  const load = () => {
    setLoading(true);
    fetchComboRules()
      .then((res) => {
        const mapped = (res.data || [])
          .map(mapFromServer)
          .sort((a,b)=> (a.priority??9999) - (b.priority??9999));
        setRows(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  // load services
  useEffect(() => {
    fetchServices().then((res) => setServices(res.data || []));
  }, []);

  // quick inline edits (title, monthlyDiscount)
  const processRowUpdate = async (newRow) => {
    try {
      const payload = mapToServer(newRow);
      await updateComboRule(payload.id, payload);
      return newRow;
    } catch (e) {
      throw e;
    }
  };

  const handleRowUpdateError = (err) => {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  };

  // open json editor
  const handleEditJson = (row) => setOpenDlg({ open: true, rule: row });

  // save json changes
  const handleSaveRule = async (jsonObj) => {
    if (jsonObj.id) {
      await updateComboRule(jsonObj.id, jsonObj);
    } else {
      await addComboRule(jsonObj);
    }
    setOpenDlg({ open: false, rule: null });
    load();
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 60, headerAlign: 'right', align: 'right' },
    { field: 'key', headerName: 'Key', width: 120 },
    { field: 'title', headerName: '제목', width: 220, editable: true },
    { field: 'priority', headerName: '우선순위', width: 110, type:'number', editable: true, headerAlign:'right', align:'right' },
    { field: 'requiredList', headerName: '필수 서비스', width: 200 },
    {
      field: 'monthlyDiscount',
      headerName: '월 할인(원)',
      width: 120,
      editable: true,
      headerAlign: 'right',
      align: 'right',
      renderCell: ({ row }) => Number(row?.monthlyDiscount || 0).toLocaleString(),
      type: 'number',
    },
    { field: 'combineList', headerName: '중복 허용', width: 200 },
    {
      field: 'actions',
      headerName: '',
      width: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display:'flex', gap:1, alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
          <IconButton size="small" onClick={()=> moveRow(row.id,'up')}><ArrowUpwardIcon fontSize="inherit"/></IconButton>
          <IconButton size="small" onClick={()=> moveRow(row.id,'down')}><ArrowDownwardIcon fontSize="inherit"/></IconButton>
          <Button size="small" variant="outlined" onClick={() => handleEditJson(row)}>
            수정
          </Button>
          <Button size="small" color="error" onClick={async()=>{
            if(window.confirm('정말 삭제하시겠습니까?')){
              await deleteComboRule(row.id);
              load();
            }
          }}>삭제</Button>
        </Box>
      )
    }
  ];

  const moveRow = (rowId, direction) => {
    setRows(prev=>{
      const next=[...prev];
      const idx = next.findIndex(r=> r.id===rowId);
      const targetIdx = idx + (direction==='up'? -1:1);
      if(targetIdx<0||targetIdx>=next.length) return prev;

      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];

      // reassign sequential priority 0..n-1 and persist
      const updatePromises = next.map((row,i)=>{
        if(row.priority!==i){
          row.priority=i;
          return updateComboRule(row.id, mapToServer(row));
        }
        return null;
      }).filter(Boolean);

      if(updatePromises.length){
        Promise.all(updatePromises).catch(err=>console.error('priority update failed',err));
      }
      return next;
    });
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          결합 할인 규칙
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => {
            setOpenDlg({ open: true, rule: null });
          }}
        >
          새 할인 규칙
        </Button>
      </Box>
      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          pageSizeOptions={[50]}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleRowUpdateError}
          disableColumnResize={false}
          sx={{ minWidth: 1200 }}
        />
      </Box>

      <ComboRuleDialog
        open={openDlg.open}
        rule={openDlg.rule}
        services={services}
        ruleKeys={ruleKeys}
        onClose={() => setOpenDlg({ open: false, rule: null })}
        onSave={handleSaveRule}
      />
    </Box>
  );
} 