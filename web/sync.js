pages.sync={n:'云端同步'};
const syncKey='WriteFlow.supabase.v1';
const config=()=>JSON.parse(localStorage.getItem(syncKey)||'{}');
const storeConfig=c=>localStorage.setItem(syncKey,JSON.stringify(c));
let syncMessage='',syncTask=null;
function syncPage(){
 const c=config(),m=S.cloud||{};
 return topbar()+'<section class="setting"><h2>个人 Supabase 项目</h2>'+field('Project URL','cloudURL',c.url)+field('Publishable Key','cloudKey',c.key)+action('保存配置','cloudSave')+action('测试连接','cloudTest')+action('断开连接','cloudDisconnect')+'<details><summary>初始化数据库</summary><p>在自己的 Supabase 项目打开 SQL Editor，复制下方 SQL 并运行一次，然后测试连接。</p>'+action('复制 SQL','cloudCopy')+'<textarea readonly>'+esc(syncSchema)+'</textarea></details></section><section class="setting"><h2>同步账号</h2>'+
 (c.session?'<p>'+esc(c.session.user.email)+'</p>'+action('退出登录','cloudLogout'):field('邮箱','cloudEmail')+field('唯一用户名（注册时填写，3–32 位字母、数字或下划线）','cloudName'))+
 '<label>'+ (c.session?'新密码':'密码')+'<input id="cloudPass" type="password"></label>'+
 (c.session?action('修改密码','cloudPassword'):action('登录','cloudLogin')+action('注册','cloudRegister'))+'</section><section class="setting"><h2>同步状态</h2><p role="status" id="cloudStatus">'+esc(syncMessage||(c.session?'已登录':c.url?'已配置':'纯本地模式'))+'</p><p>上次同步　'+esc(m.last||'尚未同步')+' · 待上传答题记录 '+Object.keys(eventDelta(S)).length+'</p>'+action('立即同步','cloudNow')+'</section>';
}
function eventDelta(s){
 const rows=s.logs.slice(s.progressStart||0);
 const delta=Object.fromEntries(rows.filter(r=>!s.cloud?.known?.[r.id]).map(r=>[r.id,{id:r.id,q:r.q,batch:r.batch,at:r.at,values:r.values,ok:r.ok}]));
 if(s.progressStart==null)for(const r of s.errors)if(questionById.has(r.q)&&!rows.some(l=>l.q===r.q)&&!s.cloud?.known?.[r.id])delta[r.id]={id:r.id,q:r.q,at:r.at,values:[r.wrong||''],ok:r.done,legacy:true};
 return delta;
}
async function requestCloud(c,path,body,method='POST',token){
 const r=await fetch(c.url+path,{method,headers:{apikey:c.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:globalThis.AbortSignal?.timeout?.(25000)}).catch(()=>{throw Error('网络不可达或超时，请检查项目地址与网络')});
 const data=await r.text();let j;try{j=JSON.parse(data)}catch{}
 if(!r.ok)throw Error((r.status===401?'密钥或登录凭据无效':r.status===403?'云端权限不足':r.status===404?'项目地址错误或尚未执行初始化 SQL':'云端请求失败')+' · '+(j?.msg||j?.message||j?.error_description||r.status));
 return j;
}
async function cloudAction(a){
 if(syncTask)await syncTask;
 let c=config();
 if(a==='cloudCopy'){await navigator.clipboard.writeText(syncSchema);toast('已复制 SQL');return}
 if(a==='cloudSave'){const url=el('cloudURL').value.trim().replace(/\/$/,''),key=el('cloudKey').value.trim();
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!/^sb_publishable_[\w-]+$/.test(key))throw Error('请输入 Supabase 项目 HTTPS 地址和 sb_publishable_ 开头的公开密钥');
 storeConfig({...((url===c.url)?c:{}),url,key});syncMessage='配置已保存';render();return}
 if(a==='cloudDisconnect'||a==='cloudLogout'){if(c.session)await requestCloud(c,'/auth/v1/logout?scope=local',{},'POST',c.session.access_token).catch(()=>{});delete c.session;storeConfig(a==='cloudDisconnect'?{}:c);syncMessage='本机已断开，学习数据已保留';render();return}
 if(!c.url)throw Error('请先保存项目配置');
 if(a==='cloudTest'){await requestCloud(c,'/auth/v1/settings',undefined,'GET');if(c.session)await requestCloud(c,'/rest/v1/wf_profiles?select=id&limit=1',undefined,'GET',c.session.access_token);syncMessage=c.session?'已连接云端':'项目连接正常，登录后检查数据库';render();return}
 if(a==='cloudNow')return runSync();
 if(a==='cloudPassword'){await requestCloud(c,'/auth/v1/user',{password:el('cloudPass').value},'PUT',c.session.access_token);syncMessage='密码已更新';render();return}
 const signup=a==='cloudRegister',body={email:el('cloudEmail').value.trim(),password:el('cloudPass').value};
 if(signup){const name=el('cloudName').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,32}$/.test(name))throw Error('用户名格式错误');body.data={username:name}}
 const session=await requestCloud(c,signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',body);
 if(!session.access_token){syncMessage='请检查邮箱，确认后回到这里登录';render();return}
 const owner=c.url+'/'+session.user.id;
 if(!S.cloud?.owner && (S.logs.length||S.errors.length) && !confirm('将本机已有练习记录绑定并同步至 '+session.user.email+'？'))return;
 await change(s=>{if(s.cloud?.owner&&s.cloud.owner!==owner)throw Error('本机学习记录已绑定其他账号，请使用独立浏览器配置或原账号');s.cloud||={};s.cloud.owner=owner});
 storeConfig({...c,session});syncMessage='已登录';render();await runSync();
}
function runSync(){
 if(syncTask)return syncTask;
 syncTask=exchange().catch(e=>{syncMessage=e.message;if(page==='sync')el('cloudStatus').textContent=syncMessage}).finally(()=>syncTask=null);
 return syncTask;
}
async function exchange(){
 const c=config();if(!c.session)return;
 const owner=c.url+'/'+c.session.user.id,s=await loadState(),m=s.cloud;
 if(m?.owner!==owner)throw Error('本机数据与当前账号不匹配');
 if(c.session.expires_at*1000<Date.now()+60000){const session=await requestCloud(c,'/auth/v1/token?grant_type=refresh_token',{refresh_token:c.session.refresh_token});if(config().session?.refresh_token!==c.session.refresh_token)return;c.session=session;storeConfig(c)}
 const delta=eventDelta(s),settings=s.prefs.training||{},practice=s.practice;
 let device=localStorage.getItem('WriteFlow.device');if(!device){device=uid();localStorage.setItem('WriteFlow.device',device)}for(const r of Object.values(delta))r.device=device;
 const r=await requestCloud(c,'/rest/v1/rpc/wf_exchange',{delta,base_revision:m.rev||0,base_epoch:m.epoch||0,reset_cycle:!!m.reset,previous_settings:JSON.parse(m.settings||'null'),previous_practice:JSON.parse(m.practice||'null'),new_settings:JSON.stringify(settings)!==m.settings?settings:null,new_practice:practice,practice_changed:JSON.stringify(practice)!==m.practice},'POST',c.session.access_token);
 if(config().session?.user.id!==c.session.user.id||config().url!==c.url)return;
 if(r.id!==c.session.user.id || !r.events || Array.isArray(r.events))throw Error('云端响应账号或格式错误');
 for(const [id,row] of Object.entries(r.events)){
  if(id!==row.id || !questionById.has(row.q)||typeof row.ok!=='boolean'||!dateOk(row.at)||!Array.isArray(row.values)||!row.values.every(str))throw Error('云端答题记录格式不兼容，本地数据已保留');
 }
 if(r.practice && (!Array.isArray(r.practice.ids)||!r.practice.ids.every(id=>questionById.has(id))||!Number.isInteger(r.practice.index)||r.practice.index<0||r.practice.index>=r.practice.ids.length))throw Error('云端练习会话不兼容');

 await change(v=>{
 if(v.cloud?.owner!==owner||v.cloud.reset!==m.reset||v.cloud.rev!==m.rev)throw Error('本机进度已变化，将重新同步');
 const existing=new Set(v.logs.map(l=>l.id));
 if(r.epoch!==(m.epoch||0)&&!m.reset){v.progressStart=v.logs.length;v.practice=null}
 for(const row of Object.values(r.events)){if(!existing.has(row.id)&&questionById.has(row.q)&&Array.isArray(row.values))v.logs.push(row)}
 if(JSON.stringify(v.practice)===JSON.stringify(practice))v.practice=r.practice;
 if(JSON.stringify(v.prefs.training||{})===JSON.stringify(settings)&&r.settings)v.prefs.training=r.settings;
 v.cloud={owner,device,rev:r.revision,epoch:r.epoch,known:Object.fromEntries(Object.keys(r.events).map(id=>[id,true])),settings:JSON.stringify(r.settings||{}),practice:JSON.stringify(r.practice),last:now()};
 });
 syncMessage='同步成功';if(page==='quiz' && JSON.stringify(practice)!==JSON.stringify(S.practice)){displaySession();render()}else if(['home','errors','sync'].includes(page)&&!busy)render();else if(page==='sync')render();
}
let syncTimer;
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(config().session)runSync()},1200)}
if(window.addEventListener){window.addEventListener('online',scheduleSync);window.addEventListener('focus',scheduleSync);window.addEventListener('load',scheduleSync);setInterval(()=>{if(!document.hidden && config().session)runSync()},90000)}
