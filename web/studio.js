pages.setup={n:'练习设置'};
pages.tips.n='学习技巧'; pages.settings.n='设置';pages.errors.n='错题本';
const topicsUI=[
 ['词汇训练','单词训练','在语境中辨词、选词与拼写。','M3 18l5-13 5 13M5 13h6 M15 12q6-4 6 1v5m0-5q-8-1-6 4q2 3 6-1'],
 ['语法训练','语法训练','理清时态、从句与词形变化。','M3 6h18M3 12h18M3 18h18M8 3v6m9 0v6m-9 0v6'],
 ['句子训练','句子训练','从词序到结构，组织完整表达。','M3 5h13M7 12h14M3 19h12'],
 ['阅读理解','阅读理解','细读文章，寻找支持答案的证据。',icons.home],
 ['短文完形','完形填空','联系上下文，补全篇章。','M3 5h18M3 12h4m3 2h6m3-2h2M3 19h18'],
 ['中译英训练','中译英训练','将中文意思写成自然的英文。','M3 5h13m-6-3v3M5 8q2 5 9 8M14 6q-3 8-11 12m11 3 4-10 4 10m-6-3h5']
];
const lineIcon=path=>'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
const navigation=[['home','练习','M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'],['errors','错题','M5 3h14v18l-7-4-7 4z M9 8h6'],['tips','学习技巧',icons.tips],['free','写作',icons.free],['settings','设置','M3 6h18M3 12h18M3 18h18M8 3v6m9 0v6m-9 0v6']];
function primaryNav(){
 const current=['quiz','setup','home','stats'].includes(page)?'home':['words','phrases','tips'].includes(page)?'tips':['settings','errors'].includes(page)?page:'free';
 return navigation.map(([k,t,path])=>'<button data-a="go" data-v="'+k+'" '+(k===current?'aria-current="page"':'')+'>'+lineIcon(path)+'<span>'+t+'</span></button>').join('');
}
function counts(){
 const states=questionStates(S),due=[...states.values()].filter(v=>v==='review').length;
 return {due,done:states.size,mastered:states.size-due};
}
const defaultTrain={number:10,level:'全部',random:true,save:true,resume:false};
const pref=()=>({...defaultTrain,...S.prefs.training});
let randomOrder=true,scopeMode='仅未做题目',errorType='全部',lesson='语法学习';
function home(){
 const {due,mastered}=counts(),run=currentRun(),today=S.logs.filter(l=>new Date(l.at).toDateString()===new Date().toDateString());
 const overview=[['今日完成',today.length],['已掌握',mastered],['待复习',due],['累计正确率',S.logs.length?Math.round(100*S.logs.filter(l=>l.ok).length/S.logs.length)+'%':'—']];
 return '<div class="welcome"><h1>英语专项训练</h1><p>选择训练内容，开始今天的练习。</p></div>'+
 (run?'<section class="resume row spread"><div><strong>继续上次练习</strong><p>'+esc(run.label)+' · 第 '+(run.index+1)+' / '+run.ids.length+' 题</p></div>'+action('继续练习','resume','primary')+'</section>':'')+
 '<div class="section-title"><h2>专项练习</h2>'+action('更多练习','bank','quiet')+'</div><div class="catalog">'+topicsUI.map(([key,name,desc,path])=>'<button class="subject" data-a="subject" data-v="'+key+'"><i>'+lineIcon(path)+'</i><strong>'+name+'</strong><small>'+desc+'</small></button>').join('')+'</div>'+
 '<div class="review-strip">'+lineIcon(navigation[1][2])+'<div><strong>错题复习</strong><p>'+(due?'有 '+due+' 道题等待复习':'目前没有待复习的错题')+'</p></div>'+action(due?'开始复习':'查看记录',due?'review':'go','quiet','errors')+'</div><div class="section-title"><h2>学习概览</h2>'+action('详细统计','go','quiet','stats')+'</div><div class="metrics">'+overview.map(([k,v])=>'<div><small>'+k+'</small><b>'+v+'</b></div>').join('')+'</div>';
}
function setupPage(){
 const pool=choosePool(homePool(),S,scopeMode);
 return '<div class="top"><h1>练习设置</h1></div><section class="sheet fields">'+select('训练类型','selectTopic',topicsUI.map(t=>t[1]),topicsUI.find(t=>t[0]===practiceTopic)[1])+select('难度','homeLevel',['全部',1,2,3,4,5],practiceLevel)+'<label>练习数量</label><div class="row">'+[5,10,20,30].map(n=>action(n+' 题','pickCount',Number(practiceCount)===n?'active':'',n)).join('')+'</div><label>自定义题数<input id="homeCount" type="number" min="1" value="'+esc(practiceCount)+'"></label><div class="pair">'+select('取题顺序','order',['随机','按题库顺序'],randomOrder?'随机':'按题库顺序')+select('练习范围','scopeMode',['仅未做题目','未做及待复习'],scopeMode)+'</div><div class="row spread"><small>可练 '+pool.length+' 题，本轮最多 <span id="plannedCount">'+Math.min(pool.length,Math.max(0,Number(practiceCount)||0))+'</span> 题</small>'+ (pool.length?action('开始练习','homeBegin','primary'):'本分类已练完')+'</div></section>';
}
const lessons={
 '语法学习':['先找谓语，再确定时间','By the time we arrived, the shop had closed. 先圈出 arrived，再画出关门的时间。关门早于抵达，所以用 had closed。'],
 '词汇使用':['把词放回搭配里','borrow a book from Mei 表示借入；lend a book to Mei 表示借出。把同一件事从双方角度各说一遍。'],
 '句子组织':['先搭主干，再加修饰','The parcel arrived. 加入 the parcel 的信息，变成 The parcel we ordered on Friday arrived this morning. 先确认主句仍然完整。'],
 '阅读方法':['区分观察和推断','“The floor was wet” 是观察；“It had rained” 是推断。阅读时圈出能排除其他解释的证据，再选答案。'],
 '常见错误':['检查名词中心词','The box of pencils is heavy. 谓语与 box 一致。用手遮住 of pencils，再读一遍主谓。']
};
function skillsPage(){
 return topbar()+'<div class="reader-menu">'+[...Object.keys(lessons),'写作技巧'].map(k=>action(k,'lesson',k===lesson?'active':'',k)).join('')+'</div>'+(lesson==='写作技巧'?writingTips():'<article class="sheet reading"><h2>'+lessons[lesson][0]+'</h2><p>'+lessons[lesson][1]+'</p></article>')+'<div class="row">'+action('个人词汇库','go','quiet','words')+action('表达素材','go','quiet','phrases')+'</div>';
}
function settingsPanel(){
 const p=pref(),c=counts();
 return topbar()+action('云端同步','go','quiet','sync')+'<section class="setting"><h2>外观</h2><div class="pair">'+select('阅读主题','theme',['暖纸色','白色','深色'],{paper:'暖纸色',white:'白色',dark:'深色'}[S.prefs.theme])+select('字号','font',[14,16,18,20,22],S.prefs.size)+'</div></section><section class="setting"><h2>练习偏好</h2><div class="pair">'+select('默认题数','defCount',[5,10,20,30],p.number)+select('默认难度','defLevel',['全部',1,2,3,4,5],p.level)+select('默认顺序','defRandom',['随机','按题库顺序'],p.random?'随机':'按题库顺序')+select('下次启动','defResume',['打开首页','继续上次练习'],p.resume?'继续上次练习':'打开首页')+select('新练习的会话保存','defSave',['自动保存','仅本次打开有效'],p.save?'自动保存':'仅本次打开有效')+'<label>每周目标题数<input type="number" id="goal" min="1" max="500" value="'+S.prefs.goal+'"></label></div></section><section class="setting"><h2>题目与进度</h2><p>共 '+BANK.length+' 题　已练 '+c.done+'　掌握 '+c.mastered+'　待复习 '+c.due+'</p><div class="row">'+(currentRun()?action('重置当前练习','resetCurrent'):'')+action('重置全部题目进度','resetProgress','danger')+'</div></section><section class="setting"><h2>本地数据</h2><p>'+S.logs.length+' 条答题记录 · '+S.essays.length+' 篇作文 · '+S.words.length+' 条词汇</p><div class="row">'+action('导出完整备份','backup')+action('从备份恢复','restore')+action('清理学习数据','clear','danger')+'</div></section><section class="setting"><h2>关于 WriteFlow</h2><p>3.0.3 · '+(nativeStore?'macOS 原生容器':globalThis.Android?'Android 容器':'浏览器环境')+'</p><p>从练习页选择专项，先设题量再作答。作文与学习记录保存在本机，可通过完整备份迁移。</p></section>';
}
