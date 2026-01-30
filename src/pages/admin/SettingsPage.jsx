import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { fetchMemo, updateMemo, fetchGroups, addGroup, updateGroup, deleteGroup } from '../../api.js';

export default function SettingsPage() {
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ key:'', label:'', order:0 });

  useEffect(() => {
    Promise.all([
      fetchMemo(),
      fetchGroups()
    ]).then(([memoRes, groupsRes])=>{
      if(memoRes.data && memoRes.data.defaultMemo){
        setMemo(memoRes.data.defaultMemo);
      }
      setGroups((groupsRes.data||[]).sort((a,b)=>(a.order??999)-(b.order??999)));
    }).finally(()=>setLoading(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateMemo({ defaultMemo: memo });
      alert('저장되었습니다. 새 견적서 화면에서 반영됩니다.');
    } catch (e) {
      alert('저장 중 오류:' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupAdd = async () => {
    if(!newGroup.key) return;
    const payload = { ...newGroup };
    const { data } = await addGroup(payload);
    setGroups((prev)=> [...prev, data].sort((a,b)=>(a.order??999)-(b.order??999)));
    setNewGroup({ key:'', label:'', order:0 });
  };

  const handleGroupUpdate = async (id, field, value) => {
    const grp = groups.find(g=>g.id===id);
    if(!grp) return;
    const updated = { ...grp, [field]: value };
    await updateGroup(id, updated);
    setGroups((prev)=> prev.map(g=> g.id===id? updated: g).sort((a,b)=>(a.order??999)-(b.order??999)));
  };

  const handleGroupDelete = async (id) => {
    if(!window.confirm('삭제하시겠습니까?')) return;
    await deleteGroup(id);
    setGroups((prev)=> prev.filter(g=>g.id!==id));
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          설정
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">기본 메모 텍스트</Typography>
        <TextField
          multiline
          minRows={8}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          fullWidth
          disabled={loading}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            저장
          </Button>
        </Box>

        {/* Group management */}
        <Box sx={{ mt:4 }}>
          <Typography variant="h6" sx={{ mb:1 }}>서비스 그룹 관리</Typography>
          {/* Existing groups */}
          <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
            {groups.map(g=> (
              <Box key={g.id} sx={{ display:'flex', gap:1, alignItems:'center' }}>
                <TextField label="Key" size="small" value={g.key} disabled sx={{ width:140 }}/>
                <TextField label="Label" size="small" value={g.label} onChange={(e)=> handleGroupUpdate(g.id,'label',e.target.value)} sx={{ flex:1 }}/>
                <TextField label="Order" size="small" type="number" value={g.order} onChange={(e)=> handleGroupUpdate(g.id,'order',parseInt(e.target.value)||0)} sx={{ width:100 }}/>
                <Button color="error" size="small" onClick={()=> handleGroupDelete(g.id)}>삭제</Button>
              </Box>
            ))}
          </Box>

          {/* Add new group */}
          <Box sx={{ display:'flex', gap:1, alignItems:'center', mt:2 }}>
            <TextField label="Key" size="small" value={newGroup.key} onChange={(e)=> setNewGroup(s=>({...s, key:e.target.value}))} sx={{ width:140 }}/>
            <TextField label="Label" size="small" value={newGroup.label} onChange={(e)=> setNewGroup(s=>({...s, label:e.target.value}))} sx={{ flex:1 }}/>
            <TextField label="Order" size="small" type="number" value={newGroup.order} onChange={(e)=> setNewGroup(s=>({...s, order: parseInt(e.target.value)||0}))} sx={{ width:100 }}/>
            <Button variant="contained" size="small" onClick={handleGroupAdd} disabled={!newGroup.key}>추가</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 