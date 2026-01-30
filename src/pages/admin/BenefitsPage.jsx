import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchBenefits, addBenefit, updateBenefit, deleteBenefit } from '../../api.js';

export default function BenefitsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', giftCard: 0, cash: 0 });

  const load = () => {
    setLoading(true);
    fetchBenefits().then((res) => {
      setRows(res.data);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const processRowUpdate = async (newRow) => {
    try {
      await updateBenefit(newRow.id, newRow);
      return newRow;
    } catch (e) {
      throw e;
    }
  };

  const handleRowUpdateError = (err) => {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  };

  const handleAdd = async () => {
    await addBenefit(newItem);
    setOpenAdd(false);
    setNewItem({ label: '', giftCard: 0, cash: 0 });
    load();
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          새 혜택
        </Button>
      </Box>
      <Box sx={{ width:'100%', overflowX:'scroll' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field: 'id', headerName: 'ID', width: 70, headerAlign: 'right', align: 'right' },
            { field: 'label', headerName: '이름', width: 180, editable: true },
            { field: 'giftCard', headerName: '상품권', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
            { field: 'cash', headerName: '현금', width: 120, editable: true, type: 'number', headerAlign: 'right', align: 'right' },
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
                        await deleteBenefit(params.row.id);
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
          sx={{ minWidth: 700 }}
        />
      </Box>

      {/* Add dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>새 혜택</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="이름" value={newItem.label} onChange={(e) => setNewItem((s) => ({ ...s, label: e.target.value }))} />
          <TextField label="상품권" type="number" value={newItem.giftCard} onChange={(e) => setNewItem((s) => ({ ...s, giftCard: parseInt(e.target.value)||0 }))} />
          <TextField label="현금" type="number" value={newItem.cash} onChange={(e) => setNewItem((s) => ({ ...s, cash: parseInt(e.target.value)||0 }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>취소</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newItem.label}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 