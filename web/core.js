'use strict';
const cats=['动词与句法','写作表达','双向翻译','单词','时态','代词','介词','冠词','词形变化','句子结构','名词量词与主谓一致','情态被动与非谓语','从句与连接词','纠错与句型转换','短文完形','固定搭配与短语动词','阅读理解与语境判断'];
const errors=['拼写错误','时态错误','代词使用错误','主谓一致','名词单复数','介词','冠词','词形变化','句子结构','表达不准确'];
const fresh=()=>({schema:1,knowledge:{},practice:null,progressStart:null,prefs:{theme:'mist',size:16,goal:20},logs:[],errors:[],essays:[],words:[],phrases:[],drafts:{},sessions:[]});
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const now=()=>new Date().toISOString();
const norm=s=>String(s).normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').replace(/[.!?。！？]+$/,'').trim();
const grade=(slots,values)=>slots.length===values.length&&slots.every((alts,i)=>alts.some(a=>norm(a)===norm(values[i])));
function weekStart(d=new Date()){d=new Date(d);d.setDate(d.getDate()-(d.getDay()+6)%7);d.setHours(0,0,0,0);return d}
let db,S,busy=false;
function openIndexedDB(){return new Promise((ok,no)=>{let req=indexedDB.open('WriteFlow.local.v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>{db=req.result;db.onversionchange=()=>db.close();ok()};req.onerror=()=>no(req.error)})}
const fallbackKey='WriteFlow.file.v1';
let fileStore=false,nativeQueue=Promise.resolve();
const nativeStore=globalThis.webkit?.messageHandlers?.writeflow;
const nativeCall=(op,args={})=>nativeStore.postMessage({op,...args});
async function openDB(){
    if(nativeStore)return;
    // Keep using an existing fallback database after browser upgrades.
    try { if(localStorage.getItem(fallbackKey)!==null){fileStore=true;return} } catch {}
    try { await openIndexedDB(); }
    catch(e){
        if(!['ReferenceError','SecurityError','InvalidStateError','NotSupportedError','UnknownError'].includes(e.name))throw e;
        const lock=globalThis.navigator?.locks;
        if(!lock)throw Error('此浏览器缺少安全的本地存储支持');
        await lock.request(fallbackKey,()=>{if(localStorage.getItem(fallbackKey)===null)localStorage.setItem(fallbackKey,JSON.stringify(fresh()))});
        fileStore=true;
    }
}
function loadState(){if(nativeStore)return nativeCall('load').then(r=>JSON.parse(r.json)||fresh());if(fileStore)return Promise.resolve(JSON.parse(localStorage.getItem(fallbackKey)));return new Promise((ok,no)=>{let r=db.transaction('state').objectStore('state').get('user');r.onsuccess=()=>ok(r.result||fresh());r.onerror=()=>no(r.error)})}
function change(fn){
    if(nativeStore){
        const commit=async()=>{let r=await nativeCall('load'),v=JSON.parse(r.json)||fresh();fn(v);if(!await nativeCall('commit',{json:JSON.stringify(v),revision:r.revision}))throw Error('本机保存未完成，请重试');S=v};
        nativeQueue=nativeQueue.catch(()=>{}).then(commit);return nativeQueue;
    }
    if(fileStore)return navigator.locks.request(fallbackKey,()=>{let current=JSON.parse(localStorage.getItem(fallbackKey));if(!current)throw Error('本地存储已清除，请重新打开软件');fn(current);localStorage.setItem(fallbackKey,JSON.stringify(current));S=current});return new Promise((ok,no)=>{let tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),r=store.get('user'),next,why;r.onsuccess=()=>{try{next=r.result||fresh();fn(next);store.put(next,'user')}catch(e){why=e;tx.abort()}};tx.oncomplete=()=>{S=next;ok()};tx.onabort=()=>no(why||tx.error||Error('本地保存失败'))})}
function applyTheme(){document.body.dataset.theme=S.prefs.theme;document.body.style.setProperty('--size',S.prefs.size+'px')}

