// Two isolated local stores exercise the client against an in-memory RPC double.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/../web/sync.js','utf8');
const remote=new Map();
function device(user){
 const map=new Map(),state={cloud:{owner:'https://test.supabase.co/'+user},prefs:{},logs:[],errors:[],practice:null};
 const ctx={pages:{},window:{},crypto,structuredClone,uid:()=>crypto.randomUUID(),now:()=>new Date().toISOString(),page:'setup',busy:false,questionById:new Map([['WF001',{}]]),dateOk:t=>Number.isFinite(Date.parse(t)),str:x=>typeof x==='string',localStorage:{getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},loadState:async()=>structuredClone(state),change:async f=>f(state)};
 ctx.fetch=async(url,req)=>{
 if(ctx.offline)throw Error('offline');
 const d=JSON.parse(req.body),id=req.headers.Authorization.slice(7);
 const r=remote.get(id)||{id,epoch:0,revision:0,events:{},settings:null,practice:null};
 Object.assign(r.events,d.delta);if(d.base_revision===r.revision){if(d.new_settings)r.settings=d.new_settings;if(d.practice_changed)r.practice=d.new_practice}
 r.revision++;remote.set(id,r);return {ok:true,text:async()=>JSON.stringify(r)};
 };
 vm.createContext(ctx);vm.runInContext(src,ctx);const ev=s=>vm.runInContext(s,ctx);
 ev('storeConfig('+JSON.stringify({url:'https://test.supabase.co',key:'mock',session:{user:{id:user},access_token:user,expires_at:Date.now()}})+')');
 return {ctx,state,sync:()=>ev('exchange()')};
}
(async()=>{
 const a=device('a'),b=device('a'),other=device('b');
 const attempt=(id,ok)=>({id,q:'WF001',ok,values:['test'],at:new Date().toISOString()});
 a.state.logs.push(attempt('first',false));await a.sync();await b.sync();assert.equal(b.state.logs[0].ok,false);
 b.state.logs.push(attempt('review',true));b.ctx.offline=true;await assert.rejects(b.sync());b.ctx.offline=false;await b.sync();await a.sync();await a.sync();assert.equal(a.state.logs.length,2);assert.equal(a.state.logs[1].ok,true);
 await other.sync();assert.equal(other.state.logs.length,0);console.log('PASS two simulated devices, offline retry, reverse sync, deduplication, separate user responses');
})().catch(e=>{console.error(e);process.exitCode=1});
