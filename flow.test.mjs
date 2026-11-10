import test from 'node:test';
import assert from 'node:assert/strict';
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',dataset:{},showModal(){this.open=true},close(){this.open=false}});return nodes.get(id);}
let hash='',listener;const writes=new Map();
globalThis.document={querySelector:node,addEventListener(type,fn){this.click=fn}};
globalThis.location={get hash(){return hash},set hash(v){hash=v;listener?.()}};
globalThis.window={addEventListener(type,fn){listener=fn}};
globalThis.localStorage={getItem:k=>writes.get(k)||null,setItem:(k,v)=>writes.set(k,v)};
globalThis.FormData=class{constructor(data){this.data=data}get(k){return this.data[k]??''}};
await import('./dist/app.mjs');
const submit=(id,data)=>node(id).onsubmit({preventDefault(){},target:data});
const click=id=>node(id).onclick({target:node(id)});
test('과제 입력→재분할→증가→중단→기록→재시작 흐름',()=>{
 submit('#task-form',{title:'  시연 보고서  ',due:'2026-12-01',stage:'본문 작성 중'});
 let db=JSON.parse(writes.get('first-step-v1'));const id=db.tasks[0].id;assert.equal(db.tasks[0].title,'시연 보고서');assert.match(node('#app').innerHTML,/첫 문장 적기/);
 click('#hard');node('#reason').value='크게 느껴져요';click('#adapt');assert.match(node('#app').innerHTML,/단어 하나 작성/);
 click('#easy');click('#increase');assert.match(node('#app').innerHTML,/문단 초안 적기/);
 click('#pause');assert.match(node('#app').innerHTML,/잠시 쉬는 중/);
 location.hash='#task/'+id;assert.match(node('#app').innerHTML,/잠시 멈춘 자리/);
 submit('#result',{outcome:'일부 진행',difficulty:'어려워요',note:'세 문장 중 한 문장 작성'});
 db=JSON.parse(writes.get('first-step-v1'));assert.equal(db.logs.length,1);assert.equal(db.logs[0].difficulty,'어려워요');assert.match(node('#app').innerHTML,/진행한 부분도/);
 location.hash='#task/'+id;assert.match(node('#app').innerHTML,/문단 초안 적기/);
 document.click({target:{closest:s=>s==='[data-support]'?{}:null}});assert.equal(node('#support').open,true);
});
test('공백 제목 방지',()=>{location.hash='#home';const before=JSON.parse(writes.get('first-step-v1')).tasks.length;submit('#task-form',{title:'   '});assert.equal(JSON.parse(writes.get('first-step-v1')).tasks.length,before);assert.match(node('#form-error').textContent,/적어주세요/);});
