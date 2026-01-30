import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete } from '@mui/material';

function buildInitialState(rule){
  if(!rule){
    return {
      key:'',
      title:'',
      giftCard:0,
      cash:0,
      required:[],
      options:[], // {svc,label}
      combineWith: []
    };
  }
  const optsArr=[];
  if(rule.conditions?.options){
    Object.entries(rule.conditions.options).forEach(([svc,labels])=>{
      labels.forEach(lab=> optsArr.push({svc,label:lab}));
    });
  }
  return {
    key: rule.key||'',
    title: rule.title||'',
    giftCard: rule.giftCard||0,
    cash: rule.cash||0,
    required: rule.conditions?.required||[],
    options: optsArr,
    combineWith: rule.canCombineWith || []
  };
}

export default function BenefitRuleDialog({open,onClose,rule,services=[],ruleKeys=[],onSave}){
  const [state,setState]=useState(buildInitialState(rule));

  useEffect(()=>{ setState(buildInitialState(rule));},[rule]);

  const serviceKeys=services.map(s=>s.key);

  const [selectedSvc, setSelectedSvc] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // ensure selectedSvc always valid
  useEffect(()=>{
    if(state.required.length && !state.required.includes(selectedSvc)){
      setSelectedSvc(state.required[0]);
    }
  },[state.required, selectedSvc]);

  const handleChange=(field,val)=> setState(p=>({...p,[field]:val}));

  // helper to get labels for service
  const getLabels=(svc)=> state.options.filter(o=>o.svc===svc).map(o=>o.label);

  const addLabelToService = () => {
    if(!selectedSvc || !newLabel) return;
    if(getLabels(selectedSvc).includes(newLabel)) return;
    setState(p=>({...p, options:[...p.options, {svc:selectedSvc, label:newLabel}] }));
    setNewLabel('');
  };

  const removeLabelFromService = (label) => {
    setState(p=>({...p, options:p.options.filter(o=> !(o.svc===selectedSvc && o.label===label)) }));
  };

  const handleOptionChange=(idx,field,val)=>{
    setState(p=>{
      const arr=[...p.options];
      arr[idx]={...arr[idx],[field]:val};
      return {...p,options:arr};
    });
  };
  const addOptionRow=()=> setState(p=>({...p,options:[...p.options,{svc:'',label:''}]}));
  const removeOptionRow=idx=> setState(p=>({...p,options:p.options.filter((_,i)=>i!==idx)}));

  const slugify=str=> str.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

  const handleSave=()=>{
    const keyFinal=(state.key||slugify(state.title));
    if(!keyFinal){ alert('Key 또는 제목을 입력하세요'); return; }
    if(!rule && ruleKeys.includes(keyFinal)){ alert('이미 존재하는 key 입니다'); return; }

    const optionsObj={};
    state.options.forEach(({svc,label})=>{
      if(!svc||!label) return;
      if(!optionsObj[svc]) optionsObj[svc]=[];
      if(!optionsObj[svc].includes(label)) optionsObj[svc].push(label);
    });
    const jsonBase={
      key:keyFinal,
      title:state.title,
      giftCard:Number(state.giftCard)||0,
      cash:Number(state.cash)||0,
      canCombineWith: state.combineWith || [],
      conditions:{
        required:state.required,
        options:optionsObj
      }
    };
    const json= rule ? {id:rule.id,...jsonBase}: jsonBase;
    onSave(json);
  };

  return (
    <Dialog open={open} onClose={()=>onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{rule?'혜택 규칙 수정':'새 혜택 규칙'}</DialogTitle>
      <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,mt:1,pb:20,maxHeight:'80vh',overflowY:'auto'}}>
        <TextField label="제목" fullWidth value={state.title} onChange={e=>handleChange('title',e.target.value)} sx={{mt:1}}/>
        <TextField label="Key" value={state.key} onChange={e=>handleChange('key',e.target.value)} helperText="공백 없이 영문/숫자/underscore"/>
        <TextField label="상품권" type="number" value={state.giftCard} onChange={e=>handleChange('giftCard',e.target.value)} fullWidth />
        <TextField label="현금" type="number" value={state.cash} onChange={e=>handleChange('cash',e.target.value)} fullWidth />

        {/* duplicate conflict keys */}
        <Autocomplete
          multiple
          options={ruleKeys.filter(k=>k!==state.key)}
          value={state.combineWith}
          onChange={(_e,val)=>handleChange('combineWith',val)}
          renderInput={(params)=><TextField {...params} label="동시 적용 불가 Key" placeholder="선택 또는 입력" />}
          freeSolo
          sx={{ mt: 1 }}
        />

        {/* required services */}
        <Autocomplete multiple options={serviceKeys} value={state.required} onChange={(_e,val)=>handleChange('required',val)} renderInput={(params)=><TextField {...params} label="필수 서비스"/>}/>

        {/* Option selection by service */}
        {state.required.length>0 && (
          <Box>
            <Typography variant="subtitle1" sx={{mb:1}}>옵션 조건</Typography>
            {/* service tabs */}
            <Tabs value={selectedSvc} onChange={(_e,val)=>setSelectedSvc(val)} sx={{mb:2}}>
              {state.required.map(svcKey=> (
                <Tab key={svcKey} value={svcKey} label={svcKey} />
              ))}
            </Tabs>
            {selectedSvc && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                <Box sx={{display:'flex',gap:2,alignItems:'center'}}>
                  {(()=>{
                    const svcObj = services.find(s=>s.key===selectedSvc);
                    const labels = (svcObj?.options||[]).filter(o=>o.type!=='divider').map(o=>o.label);
                    const available = labels.filter(l=> !getLabels(selectedSvc).includes(l));
                    return (
                      <Autocomplete
                        openOnFocus
                        sx={{ flex: 1 }}
                        options={available}
                        value={newLabel}
                        onInputChange={(_e, val) => setNewLabel(val)}
                        onChange={(_e, val) => setNewLabel(val)}
                        PaperProps={{ sx: { mt: 1, bgcolor: '#fff', border: '1px solid #bbb', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.20),0 -2px 8px rgba(0,0,0,0.15)', backdropFilter:'blur(1px)' } }}
                        renderInput={(params) => <TextField {...params} label="옵션 라벨 추가" />}
                      />
                    );
                  })()}
                  <Button variant="outlined" size="small" onClick={addLabelToService}>추가</Button>
                </Box>
                {/* chips */}
                <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
                  {getLabels(selectedSvc).map(lab=> (
                    <Chip key={lab} label={lab} onDelete={()=>removeLabelFromService(lab)} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>onClose(false)}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={!state.title}>저장</Button>
      </DialogActions>
    </Dialog>
  );
} 