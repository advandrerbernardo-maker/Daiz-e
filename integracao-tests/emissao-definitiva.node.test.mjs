import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>\s*const _h=[\s\S]*?<\/script>/)?.[0].slice(8,-9);
assert.ok(js,'Script principal Daiz-e precisa existir');
const bridge=js.slice(js.indexOf('const RECEBI_RECEIPT_HANDOFF_KEY='),js.indexOf('const CHAVE_ASSINATURA='));
const confirmCode=js.slice(js.indexOf('const confirm=()=>{'),js.indexOf("\n};\n\nif(scr==='done'")+3);
assert.ok(bridge.includes('receberRascunhoDoRecebi'));
assert.ok(confirmCode.includes('integracaoRecebi'));

const makeHandoff=({payload,query='?recebiplus=1',receipts=[],deleted=[]}={})=>{
 const store=new Map(payload?[['recebiplus-daize-receipt-handoff-v1',JSON.stringify(payload)]]:[]);
 const localStorage={
  getItem:k=>store.get(k)??null,
  setItem:(k,v)=>store.set(k,v),
  removeItem:k=>store.delete(k)
 };
 const ls={get:(k,d)=>k==='dz-r'?receipts:k==='dz-r-lixeira'?deleted:d};
 const window={location:{search:query}};
 const factory=new Function('localStorage','window','URLSearchParams','ls',bridge+';return {RECEBI_RECEBIDO,RECEBI_EMITIDO,RECEBI_LIXEIRA,vinculadaAoRecebi};');
 const data=factory(localStorage,window,URLSearchParams,ls);
 return {...data,store};
};
const handoffData=(overrides={})=>({
 kind:'recebiplus-daize-receipt-v1',source:'paid',owner_id:'owner-1',charge_id:'charge-1',
 created_at:Date.now(),nonce:'nonce1',name:'Pessoa Recebedora',cents:150000,description:'Entrada lote',...overrides
});
test('Original do Daiz-e recebe somente rascunho real autorizado e sintaxe permanece válida',()=>{
 assert.doesNotThrow(()=>new Function(js));
 assert.match(html,/<title>Daiz-e · Recibos<\/title>/);
 assert.match(html,/4\.6\.0-integracao-recibo-definitivo/);
 assert.doesNotMatch(html,/TESTE - SEM VALIDADE/);
 const o=makeHandoff({payload:handoffData()});
 assert.equal(o.RECEBI_RECEBIDO.name,'Pessoa Recebedora');
 assert.equal(o.RECEBI_RECEBIDO.cents,150000);
 assert.equal(o.RECEBI_RECEBIDO.chargeId,'charge-1');
 assert.equal(o.RECEBI_RECEBIDO.ownerId,'owner-1');
 assert.equal(o.store.size,0,'Handoff deve ser consumido apenas uma vez');
});
test('Link normal do Daiz-e não consome rascunho inesperado',()=>{
 const a=makeHandoff({payload:handoffData(),query:''});
 assert.equal(a.RECEBI_RECEBIDO,null);
 assert.equal(a.store.size,1);
});
test('Handoff vencido, inválido ou de teste não emite recibo definitivo',()=>{
 for(const malformed of [
  handoffData({created_at:Date.now()-200000}),
  handoffData({kind:'recebiplus-daize-test-v1'}),
  handoffData({source:'demo'}),
  handoffData({cents:-2}),
  handoffData({name:''}),
  handoffData({owner_id:''}),
 ]){
  const a=makeHandoff({payload:malformed});
  assert.equal(a.RECEBI_RECEBIDO,null);
  assert.equal(a.store.size,0);
 }
});
test('Detecta mesmo pagamento já emitido ou arquivado na lixeira sem emitir outro',()=>{
 const existing={id:'recibo-3',numero:'0003',integracaoRecebi:{ownerId:'owner-1',chargeId:'charge-1'}};
 const active=makeHandoff({payload:handoffData(),receipts:[existing]});
 assert.equal(active.RECEBI_EMITIDO,existing);
 assert.equal(active.RECEBI_LIXEIRA,null);
 const trashed=makeHandoff({payload:handoffData(),deleted:[existing]});
 assert.equal(trashed.RECEBI_EMITIDO,undefined);
 assert.equal(trashed.RECEBI_LIXEIRA,existing);
});
test('Cadastro e histórico originais continuam com chaves dz-r e dz-c',()=>{
 assert.match(js,/useState\(\(\)=>ls\.get\('dz-c',\[\]\)\)/);
 assert.match(js,/useState\(\(\)=>ls\.get\('dz-r',\[\]\)\)/);
 assert.match(js,/useEffect\(\(\)=>ls\.set\('dz-r',recs\),\[recs\]\)/);
 assert.match(js,/valor:RECEBI_RECEBIDO\.cents/);
 assert.match(js,/integracaoRecebi:\{ownerId:RECEBI_RECEBIDO\.ownerId,chargeId:RECEBI_RECEBIDO\.chargeId/);
});
function simulateConfirmation({existing=[],trash=[],consent=true,amount=150000,ownerId='owner-1',chargeId='charge-1'}={}){
 const link={ownerId,chargeId,cents:150000};
 const draft={nome:'Pessoa Recebedora',cpf:'',end:'',ref:'Entrada lote',valor:amount,forma:'PIX',data:'2026-10-23',integracaoRecebi:link};
 const captured={saved:[],current:null,route:null,confirmationCount:0,error:null,lastNumber:null};
 const ls={get:k=>k==='dz-r'?existing:k==='dz-r-lixeira'?trash:[]};
 const settings={
  d:draft,recs:existing,lixeira:trash,ls,
  vinculadaAoRecebi:(r,ref)=>!!(r.integracaoRecebi&&r.integracaoRecebi.ownerId===ref.ownerId&&r.integracaoRecebi.chargeId===ref.chargeId),
  editId:null,setCur:x=>{captured.current=x},setEditId(){},setD(){},
  go:x=>{captured.route=x},setMostrarLixeira(){},setErr:e=>{captured.error=e},
  window:{confirm(){captured.confirmationCount++;return consent}},
  EMI:{nome:'Imobiliária'},numero:'0004',setUltimoNumero:fn=>{captured.lastNumber=fn(3)},
  nRec:r=>Number.parseInt(r.numero,10),setRecs:fn=>{captured.saved=fn(existing)},
  blank:()=>({}),
 };
 const args=Object.keys(settings),params=Object.values(settings);
 const invoke=new Function(...args,confirmCode+';return confirm;')(...params);
 invoke();
 return captured;
}
test('Antes do recibo real, exige consentimento adicional e preserva dados originais',()=>{
 const a=simulateConfirmation({consent:false});
 assert.equal(a.saved.length,0);
 assert.equal(a.confirmationCount,1);
 assert.equal(a.current,null);
 const b=simulateConfirmation();
 assert.equal(b.saved.length,1);
 assert.equal(b.confirmationCount,1);
 assert.equal(b.saved[0].numero,'0004');
 assert.equal(b.saved[0].integracaoRecebi.chargeId,'charge-1');
 assert.equal(b.saved[0].integracaoRecebi.ownerId,'owner-1');
 assert.equal(b.route,'done');
});
test('Reabertura da mesma parcela mostra recibo existente, sem duplicar',()=>{
 const existing={id:'receipt-1',numero:'0002',integracaoRecebi:{ownerId:'owner-1',chargeId:'charge-1'}};
 const a=simulateConfirmation({existing:[existing]});
 assert.equal(a.current,existing);
 assert.equal(a.saved.length,0);
 assert.equal(a.confirmationCount,0);
 assert.equal(a.route,'done');
});
test('Recibo na lixeira exige restauração em vez de novo número',()=>{
 const removed={id:'receipt-old',integracaoRecebi:{ownerId:'owner-1',chargeId:'charge-1'}};
 const a=simulateConfirmation({trash:[removed]});
 assert.equal(a.saved.length,0);
 assert.equal(a.route,'hist');
 assert.match(a.error,/Restaure o recibo/);
});
test('Valor diferente da cobrança é bloqueado no ato de emissão',()=>{
 const a=simulateConfirmation({amount:10000});
 assert.equal(a.saved.length,0);
 assert.equal(a.route,'new');
 assert.match(a.error,/valor foi alterado/);
});
test('Data do recibo usa calendário local, evitando virada antecipada por UTC',()=>{
 assert.match(js,/const today=\(\)=>\{const d=new Date\(\);return \[d\.getFullYear\(\)/);
});
