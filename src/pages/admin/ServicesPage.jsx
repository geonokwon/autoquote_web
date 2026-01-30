import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchServices, updateService, addService, deleteService, fetchGroups } from '../../api.js';
import ServiceOptionsDialog from './ServiceOptionsDialog.jsx';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function ServicesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [newService, setNewService] = useState({ key: '', name: '', label:'', category: '상품', isCardDiscount:false, isDiscount:false });
  const [optsDlg, setOptsDlg] = useState({ open: false, service: null });
  const [filterGroup, setFilterGroup] = useState('');
  const [groups, setGroups] = useState([]);

  const mapFromServer = (svc) => ({
    ...svc,
    order: svc.order ?? 0,
    multiSelect: svc.meta?.multiSelect ?? false,
    maxQuantity: svc.meta?.maxQuantity ?? 1,
    optionCount: (svc.options||[]).filter(o=> !o.type || o.type!=='divider').length,
    isCardDiscount: svc.isCardDiscount ?? false,
    isDiscount: svc.isDiscount ?? false,
    label: svc.label || ''
  });

  const mapToServer = (row) => {
    const { multiSelect, maxQuantity, order, ...rest } = row;
    return {
      ...rest,
      order: order ?? 0,
      meta: { ...(row.meta ?? {}), multiSelect, maxQuantity },
      isCardDiscount: row.isCardDiscount ?? false,
      isDiscount: row.isDiscount ?? false,
      label: row.label
    };
  };

  const load = () => {
    setLoading(true);
    fetchServices().then((res) => {
      let mapped = (res.data || [])
        .map(mapFromServer)
        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

      // Ensure unique sequential order values starting from 0
      const updates = [];
      mapped = mapped.map((row, idx) => {
        if (row.order !== idx) {
          const updated = { ...row, order: idx };
          updates.push(updateService(updated.id, mapToServer(updated)));
          return updated;
        }
        return row;
      });

      if (updates.length) {
        // Fire-and-forget; no need to await
        Promise.allSettled(updates).catch((err) => console.error('order normalisation failed', err));
      }

      setRows(mapped);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchGroups().then((res) => {
      const ordered = (res.data || []).sort((a,b)=>(a.order ?? 9999) - (b.order ?? 9999));
      setGroups(ordered);
    });
  }, []);

  useEffect(load, []);

  const processRowUpdate = async (newRow) => {
    try {
      const payload = mapToServer(newRow);
      await updateService(payload.id, payload);
      return newRow;
    } catch (err) {
      throw err;
    }
  };

  const handleRowUpdateError = (error) => {
    console.error('row update error', error);
    alert('저장 중 오류가 발생했습니다.');
  };

  const handleSaveOptions = async (service, options) => {
    await updateService(service.id, { ...service, options });
    setOptsDlg({ open: false, service: null });
    load();
  };

  const handleAdd = async () => {
    const payload = {
      ...newService,
      order: rows.length, // append to bottom
      options: [],
      meta: {
        multiSelect: newService.multiSelect ?? false,
        maxQuantity: newService.maxQuantity ?? 1
      }
    };
    await addService(payload);
    setOpenAdd(false);
    setNewService({ key: '', name: '', label:'', category: '상품', isCardDiscount:false, isDiscount:false });
    load();
  };

  const moveRow = (rowId, direction) => {
    setRows((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.id === rowId);
      const targetIdx = idx + (direction === 'up' ? -1 : 1);
      if (targetIdx < 0 || targetIdx >= next.length) return prev;

      // swap rows in the array
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];

      // Re-assign sequential order values and gather promises
      const updatePromises = next.map((row, i) => {
        if (row.order !== i) {
          row.order = i;
          return updateService(row.id, mapToServer(row));
        }
        return null;
      }).filter(Boolean);

      // Persist all changed rows (non-blocking)
      if (updatePromises.length) {
        Promise.all(updatePromises).catch((err) => console.error('order update failed', err));
      }

      return next;
    });
  };

  // derive group list from groups collection; fallback to whatever exists on services
  const groupList = groups.length ? groups.map(g=>g.key) : Array.from(new Set(rows.map(r=> r.group||''))).filter(Boolean).sort();

  const displayedRows = filterGroup ? rows.filter(r => r.group === filterGroup) : rows;

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          서비스 관리
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          새 서비스
        </Button>
      </Box>

      {/* Filter buttons by group */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant={filterGroup === '' ? 'contained' : 'outlined'} size="small" onClick={() => setFilterGroup('')}>전체</Button>
        {groupList.map(g => (
          <Button key={g} variant={filterGroup === g ? 'contained' : 'outlined'} size="small" onClick={() => setFilterGroup(g)}>
            {(groups.find(gg=>gg.key===g)?.label) || g}
          </Button>
        ))}
      </Box>

      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={displayedRows}
          columns={[
            { field: 'id', headerName: 'ID', width: 70, headerAlign: 'right', align: 'right' },
            { field: 'key', headerName: 'Key', width: 120, editable: true },
            { field: 'name', headerName: '이름', width: 150, editable: true },
            { field: 'label', headerName: '라벨', width: 80, editable: true },
            { field: 'category', headerName: '카테고리', width: 120, editable: true },
            { field: 'group', headerName: '그룹', width: 120, editable: true },
            { field: 'isCardDiscount', headerName: '카드할인', width: 100, type: 'boolean', editable: true },
            { field: 'isDiscount', headerName: '결합할인', width: 100, type: 'boolean', editable: true },
            { field: 'multiSelect', headerName: '다중', width: 80, type: 'boolean', editable: true },
            {
              field: 'maxQuantity',
              headerName: '최대수량',
              width: 110,
              type: 'number',
              editable: true,
              headerAlign: 'right',
              align: 'right'
            },
            { field: 'optionCount', headerName: '옵션수', width: 100, headerAlign: 'right', align: 'right', type:'number' },
            {
              field: 'actions',
              headerName: '',
              width: 240,
              renderCell: (params) => {
                const { row } = params;
                return (
                  <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', gap:0.5 }}>
                    <IconButton size="small" onClick={()=> moveRow(row.id,'up')}><ArrowUpwardIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" onClick={()=> moveRow(row.id,'down')}><ArrowDownwardIcon fontSize="inherit"/></IconButton>
                    <Button size="small" variant="outlined" onClick={() => setOptsDlg({ open: true, service: row })}>
                      옵션 편집
                    </Button>
                    <Button size="small" color="error" onClick={async()=>{
                      if(window.confirm('정말 삭제하시겠습니까?')){
                        await deleteService(row.id);
                        load();
                      }
                    }}>삭제</Button>
                  </Box>
                );
              }
            }
          ]}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          pageSizeOptions={[50]}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleRowUpdateError}
          disableColumnResize={false}
          sx={{ minWidth: 800 }}
        />
      </Box>

      {/* Add dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 서비스</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Key" value={newService.key} onChange={(e) => setNewService((s) => ({ ...s, key: e.target.value }))} />
          <TextField fullWidth label="이름" value={newService.name} onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))} />
          <TextField fullWidth label="라벨" value={newService.label} onChange={(e)=> setNewService(s=>({ ...s, label:e.target.value.toUpperCase().slice(0,1) }))} />
          <TextField label="카테고리" value={newService.category} onChange={(e) => setNewService((s) => ({ ...s, category: e.target.value }))} />
          <TextField label="그룹" value={newService.group || ''} onChange={(e) => setNewService((s) => ({ ...s, group: e.target.value }))} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <label>다중선택</label>
            <input type="checkbox" checked={newService.multiSelect||false} onChange={(e)=> setNewService(s=>({...s, multiSelect:e.target.checked}))}/>
          </Box>
          <TextField label="최대수량" type="number" value={newService.maxQuantity||1} onChange={(e)=>setNewService(s=>({...s, maxQuantity: parseInt(e.target.value)||1}))} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <label>카드할인</label>
             <input type="checkbox" checked={newService.isCardDiscount||false} onChange={(e)=> setNewService(s=>({...s, isCardDiscount:e.target.checked}))}/>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <label>결합할인</label>
             <input type="checkbox" checked={newService.isDiscount||false} onChange={(e)=> setNewService(s=>({...s, isDiscount:e.target.checked}))}/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>취소</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!newService.key || !newService.name}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <ServiceOptionsDialog
        open={optsDlg.open}
        service={optsDlg.service}
        onClose={() => setOptsDlg({ open: false, service: null })}
        onSave={(opts) => handleSaveOptions(optsDlg.service, opts)}
      />
    </Box>
  );
} 