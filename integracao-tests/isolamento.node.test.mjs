import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const beta=await fs.readFile(new URL('../integracao-teste.html',import.meta.url),'utf8');
const original=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const sw=await fs.readFile(new URL('../sw.js',import.meta.url),'utf8');
const js=beta.match(/<script>\s*const _h=[\s\S]*?<\/script>/)?.[0].slice(8,-9);

test('Daiz-e oficial permanece separado da versao de teste',()=>{
 assert.match(original,/<title>Daiz-e · Recibos<\/title>/);
 assert.doesNotMatch(original,/betaReset|TESTE DE INTEGRAÇÃO/);
 assert.match(beta,/id="betaReset"/);
 assert.match(beta,/TESTE DE INTEGRAÇÃO/);
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(sw));
});
test('Teste nao grava recibos nas mesmas chaves do Daiz-e oficial',()=>{
 assert.match(beta,/const TEST_PREFIX='daize-recebiplus-experimento-20261023:'/);
 assert.match(beta,/localStorage\.getItem\(TEST_PREFIX\+k\)/);
 assert.match(beta,/localStorage\.setItem\(TEST_PREFIX\+k,JSON\.stringify\(v\)\)/);
 assert.match(beta,/localStorage\.removeItem\(TEST_PREFIX\+CHAVE_ASSINATURA\)/);
});
test('Marca de teste em PDF, PNG, JPEG, DOCX e visualizacao',()=>{
 assert.match(beta,/x\.fillText\('TESTE - SEM VALIDADE'/);
 assert.match(beta,/const dc=P\('TESTE - SEM VALIDADE'/);
 assert.match(beta,/class="beta-paper-mark">TESTE — SEM VALIDADE/);
 assert.doesNotMatch(original,/TESTE - SEM VALIDADE/);
});
test('Transferencia temporaria de uso unico e limpeza nao alteram dados oficiais',()=>{
 const start=beta.indexOf('const TEST_PREFIX=');
 const end=beta.indexOf('const CHAVE_ASSINATURA=');
 assert.ok(start>0 && end>start);
 const bridge=beta.slice(start,end);
 const store=new Map([['dz-r','RECIBOS REAIS'],['dz-c','CLIENTES REAIS']]);
 const localStorage={
  getItem:key=>store.get(key)??null,
  setItem:(key,value)=>store.set(key,value),
  removeItem:key=>store.delete(key),
  key:i=>[...store.keys()][i],
  get length(){return store.size}
 };
 let reset=null,redirect='';
 const doc={getElementById:id=>({addEventListener:(_,fn)=>{if(id==='betaReset')reset=fn}})};
 const win={confirm:()=>true,location:{replace:val=>{redirect=val}}};
 const make=new Function('localStorage','document','window',bridge+';return {consumeBetaTransfer,ls,TEST_PREFIX,HANDOFF_KEY};');
 const x=make(localStorage,doc,win);
 const obj={kind:'recebiplus-daize-test-v1',created_at:Date.now(),source:'demo',name:'CLIENTE TESTE',cents:150000,description:'Simulacao'};
 store.set(x.HANDOFF_KEY,JSON.stringify(obj));
 assert.deepEqual(x.consumeBetaTransfer(),obj);
 assert.equal(x.consumeBetaTransfer(),null);
 store.set(x.HANDOFF_KEY,JSON.stringify({...obj,created_at:Date.now()-200000}));
 assert.equal(x.consumeBetaTransfer(),null);
 x.ls.set('dz-r',[{id:'TESTE'}]);
 assert.equal(store.get('dz-r'),'RECIBOS REAIS');
 assert.ok(store.has(x.TEST_PREFIX+'dz-r'));
 assert.equal(typeof reset,'function');
 reset();
 assert.ok(!store.has(x.TEST_PREFIX+'dz-r'));
 assert.equal(store.get('dz-r'),'RECIBOS REAIS');
 assert.equal(store.get('dz-c'),'CLIENTES REAIS');
 assert.match(redirect,/integracao-teste\.html/);
});
test('Service Worker mantem cache offline original isolado do experimento',()=>{
 assert.match(sw,/const cacheTarget=url\.pathname===new URL\(betaPage\)\.pathname\?betaPage:INDEX/);
 assert.match(sw,/c\.put\(cacheTarget,copia\)/);
 assert.doesNotMatch(beta,/navigator\.serviceWorker\.register\(/);
});
