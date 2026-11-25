const main=document.querySelector('main'),nav=document.querySelector('nav');
const groups=[['学习手册',[['home','学习首页','Study desk']]],['练习',[['quiz','题库训练','Practice bank'],['sentence','句子训练','Sentence studio'],['paragraph','段落训练','Paragraph practice'],['translate','中译英','Translation']]],['写作指导',[['tips','写作技巧','Writing tips']]],['写作',[['free','自由写作','Free writing'],['guided','引导写作','Guided writing'],['essays','我的作文','My writing']]],['积累与回顾',[['errors','错题本','Error notebook'],['words','个人词汇','Vocabulary'],['phrases','表达素材','Expression library'],['stats','学习统计','Study records'],['settings','设置与备份','Preferences']]]];
const pages=Object.fromEntries(groups.flatMap(g=>g[1].map(([k,n,en])=>[k,{n,en}])));
let page='home',toastTimer,queue=[],qi=0,quizResult=null,qFilter={cat:'全部',level:'全部',mode:'全部'},quizScope=false;
const el=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action=(label,a,cls='',v='')=>'<button type="button" class="'+cls+'" data-a="'+a+'" data-v="'+esc(v)+'">'+esc(label)+'</button>';
const opt=(arr,val)=>arr.map(x=>'<option '+(String(x)===String(val)?'selected':'')+' value="'+esc(x)+'">'+esc(x)+'</option>').join('');
const select=(label,id,a,v)=>'<label>'+label+'<select id="'+id+'">'+opt(a,v)+'</select></label>';
const field=(label,id,value='',required=false)=>'<label>'+label+'<input id="'+id+'" value="'+esc(value)+'" '+(required?'required':'')+'></label>';
const area=(label,id,value='',rows=4)=>'<label>'+label+'<textarea id="'+id+'" rows="'+rows+'">'+esc(value)+'</textarea></label>';
const dateStr=s=>new Date(s).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
function toast(s){el('notice').textContent=s;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('notice').textContent='',3800)}
function topbar(desc=''){return '<div class="top"><h1>'+pages[page].n+'</h1>'+(desc?'<p class="mut">'+desc+'</p>':'')+'</div>'}
const previousPages=[];
let exitDeadline=0;
function go(k,remember=true){
 if(!pages[k])return;
 exitDeadline=0;
 if(k==='home')previousPages.length=0;
 else if(remember && k!==page)previousPages.push(page);
 page=k;nav.classList.remove('open');el('menu').setAttribute('aria-expanded','false');render();window.scrollTo(0,0)}
function navigateBack(){
 if(busy)return;
 if(page==='essays' && editorId){editorId='';render();return}
 if(recEditing && ['errors','words','phrases'].includes(page)){recEditing='';render();return}
 if(page!=='home'){go(previousPages.pop()||'home',false);return}
 const device=window.WriteFlowDevice;
 if(!device || typeof device.exitApp!=='function'){toast('已在练习首页');return}
 const now=Date.now();
 if(now<exitDeadline){exitDeadline=0;device.exitApp();return}
 exitDeadline=now+2000;toast('再按一次返回退出应用');
}
function render(){document.body.dataset.page=page;document.body.dataset.focus=String(page==='quiz'&&queue.length&&qi<queue.length?'yes':'no');nav.innerHTML=primaryNav();el('bottomTabs').innerHTML=primaryNav();main.innerHTML=page==='sync'?syncPage():page==='home'?home():page==='setup'?setupPage():page==='tips'?skillsPage():page==='quiz'?quiz():['sentence','paragraph','translate','guided','free'].includes(page)?writing():page==='essays'?essaysPage():page==='errors'?pendingErrors():['words','phrases'].includes(page)?records():page==='stats'?statistics():settingsPanel();
 const links=['free','guided','essays','sentence','paragraph','translate'].includes(page)?[['free','自由写作'],['guided','命题作文'],['sentence','句子仿写'],['paragraph','段落练笔'],['translate','翻译练笔'],['essays','我的作文']]:[];
 if(links.length)main.innerHTML='<div class="section-tabs">'+links.map(([k,t])=>action(t,'go',page===k?'active':'',k)).join('')+'</div>'+main.innerHTML;
 main.innerHTML='<div class="back-row">'+action('← 返回','back','quiet')+'</div>'+main.innerHTML;
}
const practiceChoices = {
    '句子训练': q=>['句子结构','纠错与句型转换'].includes(q.cat),
    '词汇训练': q=>['单词','词形变化','固定搭配与短语动词'].includes(q.cat),
    '语法训练': q=>['时态','代词','介词','冠词','名词量词与主谓一致','情态被动与非谓语','从句与连接词','动词与句法'].includes(q.cat),
    '短文完形': q=>kindOf(q)==='短文完形',
    '阅读理解': q=>kindOf(q)==='阅读理解',
    '中译英训练': q=>kindOf(q)==='中译英'
};
let practiceTopic='词汇训练',practiceLevel='全部',practiceCount=10;
const homePool=()=>BANK.filter(q=>practiceChoices[practiceTopic](q)&&(practiceLevel==='全部'||q.level===Number(practiceLevel)));
const icons={
 home:'M3 6l9-3 9 3v14l-9-3-9 3z M12 3v14',
 tips:'M8 15c0-2-3-3-3-7a7 7 0 0114 0c0 4-3 5-3 7 M8 16h8 M9 19h6 M10 22h4',
 free:'M4 20l4-1L20 7l-4-4L4 15z M13 6l4 4',
 stats:'M4 20h16 M7 16v-4 M12 16V5 M17 16V9'
};
function icon(k){return '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+icons[k]+'"/></svg>'}
function recent(n){const rows=[...S.logs.map(l=>({at:l.at,name:(BANK.find(q=>q.id===l.q)?.cat||'填空')+' · '+(l.ok?'答对':'需复习')})),...S.essays.flatMap(e=>e.versions.map(v=>({at:v.at,name:e.title+' · '+v.stage})))].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,n);return rows.map(l=>'<div class="entry row spread"><span>'+esc(l.name)+'</span><small>'+dateStr(l.at)+'</small></div>').join('')||'<p class="mut">完成第一道题或保存第一篇练笔后，这里会留下记录。</p>'}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function filterBank(){return BANK.filter(q=>(qFilter.cat==='全部'||q.cat===qFilter.cat)&&(qFilter.level==='全部'||q.level===Number(qFilter.level))&&(qFilter.mode==='全部'||kindOf(q)===qFilter.mode||q.kind===qFilter.mode))}
let quizScore=0,batchId='';
function quiz(){let filters='<div class="card row">'+select('知识点','qcat',['全部',...cats],qFilter.cat)+select('难度','qlevel',['全部',1,2,3,4,5],qFilter.level)+select('作答方式','qmode',['全部',...kindOrder],qFilter.mode)+action('生成练习','begin')+action('随机五题','daily')+action('整篇文章训练','articleSet')+action('综合测试 · 20 题','mixedTest')+'</div>';
if(!queue.length)return topbar('按知识点、难度或作答方式选择练习，每组最多十题。')+filters+'<section class="card"><h2>题库练习</h2><p>'+available(filterBank()).length+' 道未练习题。</p></section>';
if(qi>=queue.length)return topbar()+'<section class="hero"><h2>本组练习已完成</h2><p>共 '+queue.length+' 题，答对 '+quizScore+' 题。</p>'+action('重新选择练习','go','primary','home')+'</section>';
let q=queue[qi],res=quizResult;
let choices=answerControls(q,res);
return '<div class="section-title"><h1>'+esc(currentRun()?.label||'题库训练')+'</h1>'+'</div><progress aria-label="题组进度" max="'+queue.length+'" value="'+(qi+1)+'"></progress>'+'<section class="sheet question"><div class="row spread"><strong>'+q.cat+' · '+kindOf(q)+' · 难度 '+q.level+'</strong><span class="meta">'+(qi+1)+' / '+queue.length+'　'+q.id+'</span></div><div class="q" lang="en">'+esc(q.text)+'</div>'+(q.slotOptions||q.wordBank||['阅读理解','段落排序','英译中','句子配对','句子排序'].includes(kindOf(q))?'':'<p>'+esc(q.cn)+'</p>')+'<p class="meta">'+esc(q.hint)+'</p><form id="quizForm"><fieldset '+(res?'disabled':'')+' style="border:0;padding:0;margin:0" class="fields">'+choices+'</fieldset>'+(!res?'<button class="primary gap">提交答案</button>':'')+'</form></section>'+(res?'<section class="card"><h2 class="'+(res.ok?'good':'bad')+'">'+(res.ok?'答对了':'答错了 · 已加入待复习')+'</h2><p><b>参考答案　</b>'+esc(q.slots.map(s=>s.join(' / ')).join('　｜　'))+'</p>'+answerExplanation(q,res)+'<div class="row gap">'+action(qi+1===queue.length?'查看本组结果':'下一题　→','next','primary')+(!res.ok&&['中译英','英译中'].includes(kindOf(q))?action('我的译法意思相同，记为自评正确','acceptTranslation'):'')+'</div></section>':'')}
const errorFor={'单词':'拼写错误','时态':'时态错误','代词':'代词使用错误','介词':'介词','冠词':'冠词','词形变化':'词形变化','句子结构':'句子结构','短文完形':'句子结构','名词量词与主谓一致':'主谓一致','情态被动与非谓语':'句子结构','从句与连接词':'句子结构','纠错与句型转换':'句子结构','固定搭配与短语动词':'表达不准确','阅读理解与语境判断':'表达不准确'};
