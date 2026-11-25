let lastInteraction=Date.now(),clockTick=Date.now();
function picked(accept,fn){let input=document.createElement('input');input.type='file';input.accept=accept;input.onchange=()=>{if(input.files[0])guard(()=>fn(input.files[0]))};input.click()}
async function guard(fn){if(busy)return;busy=true;try{await fn()}catch(e){toast(e.message||'操作未完成，请检查本地存储')}finally{busy=false}}
async function act(a,v){if(a.startsWith('cloud'))return cloudAction(a);if(a==='go'){recEditing='';if(v==='essays')editorId='';go(v);return}
if(a==='resume'){S=await loadState();displaySession();go(currentRun()?'quiz':'home')}
else if(a==='resetCurrent'||a==='resetProgress')await resetPractice(a==='resetProgress');
else if(a==='bank'){queue=[];quizResult=null;go('quiz')}
else if(a==='subject'){if(practiceChoices[v]){practiceTopic=v;practiceLevel=pref().level;practiceCount=pref().number;randomOrder=pref().random;scopeMode='仅未做题目';go('setup')}}
else if(a==='homeBegin'){const pool=homePool(),count=Number(el('homeCount').value);if(!Number.isInteger(count)||count<1)return toast('请输入正整数题数');practiceCount=count;await startQuiz(pool,count,true,practiceTopic,!randomOrder,scopeMode)}
else if(a==='pickCount'){practiceCount=Number(v);render()}
else if(a==='lesson'){lesson=v;render()}
else if(a==='randomTopic')chooseTopic(true);
else if(a==='startClock'||a==='stopClock'){const minutes=Number(el('clockMinutes')?.value);await saveDraft({deadline:a==='stopClock'?0:Date.now()+60000*minutes});render()}
else if(a==='mixedTest'){const selected=[1,2,3,4,5].flatMap(k=>shuffle(available(BANK.filter(q=>q.level===k))).slice(0,4));await startQuiz(selected,20,true,'综合测试')}
else if(a==='acceptTranslation')await acceptTranslation();
else if(a==='daily'){qFilter={cat:'全部',level:'全部',mode:'全部'};await startQuiz(BANK,5,true,'随机五题')}
else if(a==='articleSet'){const eligible=available(BANK.filter(q=>q.article&&(qFilter.level==='全部'||q.level===Number(qFilter.level))));const title=shuffle([...new Set(eligible.map(q=>q.article))])[0];if(!title)return toast('该分类的题目已经全部练习完成。');await startQuiz(eligible.filter(q=>q.article===title),10,true,title,true)}
else if(a==='begin')await startQuiz(filterBank(),10);
else if(a==='next')await advance();
else if(a==='saveWriting')await saveWriting();
else if(a==='openEssay'){editorId=v;let n=S.essays.find(e=>e.id===v).versions.length;compareA=Math.max(0,n-2);compareB=n-1;render()}
else if(a==='closeEssay'){editorId='';render()}
else if(a==='deleteEssay'){if(confirm('删除这篇作文及全部历史版本？')){await pendingDraft;await change(s=>{s.essays=s.essays.filter(e=>e.id!==editorId);delete s.drafts['edit:'+editorId]});delete draftCache['edit:'+editorId];editorId='';render()}}
else if(a==='exportTxt'||a==='exportDocx'){let e=S.essays.find(x=>x.id===editorId),p=e.versions[Number(v)],doc=a==='exportDocx';await download((p.title||e.title)+'-'+p.stage+'-v'+(Number(v)+1)+(doc?'.docx':'.txt'),doc?makeDocx(p.body):new Blob(['\uFEFF',p.body],{type:'text/plain;charset=utf-8'}))}
else if(a==='importEssay')picked('.txt,.docx',importEssay);
else if(a==='editRecord'||a==='cancelRecord'){recEditing=a==='cancelRecord'?'':v;render();if(recEditing)el('recordForm').scrollIntoView({block:'center'})}
else if(['toggleDone','toggleStar','deleteRecord'].includes(a)){let k=page;if(a==='deleteRecord'&&!confirm('从本机移除这条记录？'))return;await change(s=>{let r=s[k].find(x=>x.id===v);if(!r)return;if(a==='deleteRecord')s[k]=s[k].filter(x=>x.id!==v);else if(a==='toggleDone')r.done=!r.done;else r.star=!r.star});recEditing='';render()}
else if(a==='retry'||a==='review'){await startQuiz(a==='retry'?BANK.filter(q=>q.id===v):BANK,10,true,'错题复习')}
else if(a==='prefs'){let goal=Number(el('goal').value);if(!Number.isInteger(goal)||goal<1||goal>500)return toast('每周目标请输入 1–500 之间的整数');let p={theme:{'暖纸色':'paper','白色':'white','深色':'dark'}[el('theme').value],size:Number(el('font').value),goal};await change(s=>Object.assign(s.prefs,p));applyTheme();render();toast('设置已保存')}
else if(a==='backup'){await pendingDraft;let latest=await loadState();await download('WriteFlow-备份-'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify(latest)],{type:'application/json'}))}
else if(a==='restore')picked('.json',restoreFile);
else if(a==='clear'&&confirm('清除本机全部作文、草稿、答题记录、词汇和设置？建议先导出备份。')&&confirm('确认永久清除当前设备上的 WriteFlow 学习数据？')){await pendingDraft;await change(s=>Object.assign(s,fresh()));temporaryRun=null;resetView();toast('本机学习数据已清理')}}
document.addEventListener('click',e=>{let b=e.target.closest('[data-a]');if(b?.dataset.a==='back')navigateBack();else if(b)guard(()=>act(b.dataset.a,b.dataset.v))});
el('menu').onclick=()=>el('menu').setAttribute('aria-expanded',String(nav.classList.toggle('open')));
main.addEventListener('submit',e=>{e.preventDefault();guard(e.target.id==='quizForm'?submitQuiz:saveRecord)});
main.addEventListener('input',e=>{let id=e.target.id;if(id==='homeCount'){practiceCount=e.target.value;if(el('plannedCount'))el('plannedCount').textContent=Math.min(choosePool(homePool(),S,scopeMode).length,Math.max(0,Math.floor(Number(practiceCount)||0)))}if(['wBody','wTitle','vNote','issues'].includes(id)){if(el('count'))el('count').textContent=wordCount(el('wBody').value)+' 词';saveDraft().catch(()=>{})}
else if(id==='rQuery'){recordFilter().query=e.target.value;el('rRows').innerHTML=recordRows()}
else if(id==='essaySearch'){essaySearch=e.target.value;el('essayRows').innerHTML=essayRows()}});
main.addEventListener('toggle',e=>{if(writingPages.includes(page)&&e.target.tagName==='DETAILS')showRef[draftKey()]=e.target.open},true);
main.addEventListener('change',e=>{let id=e.target.id,v=e.target.value;
if(id==='errorType'){errorType=v;render()}
else if(id==='selectTopic'){practiceTopic=topicsUI.find(t=>t[1]===v)[0];render()}
else if(id==='order'){randomOrder=v==='随机'}
else if(id==='scopeMode'){scopeMode=v;render()}
else if(['theme','font','goal'].includes(id))guard(()=>act('prefs'))
else if(id.startsWith('def')){const entry={defCount:['number',Number(v)],defLevel:['level',v],defRandom:['random',v==='随机'],defResume:['resume',v==='继续上次练习'],defSave:['save',v==='自动保存']}[id];if(entry)change(s=>{s.prefs.training={...s.prefs.training,[entry[0]]:entry[1]}}).then(scheduleSync).catch(e=>toast(e.message))}
else if(id==='homeLevel'){practiceLevel=v;render()}
else if(id.startsWith('topic-')){topicFilters[id.slice(6)]=v;chooseTopic(false)}
else if(['qcat','qlevel','qmode'].includes(id)){qFilter[{qcat:'cat',qlevel:'level',qmode:'mode'}[id]]=v;queue=[];quizResult=null;render()}
else if(id==='promptPicker'){promptIx[page]=e.target.selectedIndex;render()}
else if(id==='master'||id==='stage')saveDraft().catch(()=>{});
else if(id==='rCategory'||id==='rStatus'){recordFilter()[id==='rCategory'?'category':'status']=v;el('rRows').innerHTML=recordRows()}
else if(id==='compareA'||id==='compareB'){if(id==='compareA')compareA=e.target.selectedIndex;else compareB=e.target.selectedIndex;render()}
else if(id==='photo'&&e.target.files[0]){let f=e.target.files[0],k=draftKey();guard(async()=>{if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024)throw Error('请选择 5 MB 内的 JPEG、PNG 或 WebP 图片');let photo=await readData(f);if(draftKey()!==k)return;await saveDraft({photo});render()})}});
['pointerdown','keydown','input','scroll'].forEach(n=>document.addEventListener(n,()=>lastInteraction=Date.now(),{passive:true,capture:true}));
document.addEventListener('keydown',e=>{if(e.altKey && e.key==='ArrowLeft'){e.preventDefault();if(!e.repeat)navigateBack()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)exitDeadline=0;clockTick=Date.now();if(!document.hidden)lastInteraction=clockTick});
setInterval(()=>{let t=Date.now(),seconds=Math.floor((t-clockTick)/1000);clockTick=t;if((!db&&!fileStore&&!nativeStore)||busy||document.hidden||!['quiz','sentence','paragraph','translate','free','guided','essays','errors','words','phrases'].includes(page)||t-lastInteraction>60000||seconds<1||seconds>15)return;
change(s=>{let day=new Date().toLocaleDateString('en-CA'),r=s.sessions.find(x=>new Date(x.at).toLocaleDateString('en-CA')===day);if(r)r.seconds+=seconds;else s.sessions.push({at:now(),seconds})}).catch(()=>toast('学习时长保存失败'))},10000);
(async()=>{try{await openDB();S=await loadState();applyTheme();if(pref().resume&&S.practice){displaySession();go('quiz')}else render()}catch(e){main.textContent='本地数据库未能打开。请在普通浏览窗口启用本地存储后重新打开 WriteFlow。'}})();

