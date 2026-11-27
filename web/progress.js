// Logs keep their original IDs and order across resets. The offset starts the current cycle.
const questionById = new Map([...BANK,...curriculum.questions].map(q => [q.id,q]));
function questionStates(s) {
    const states = new Map();
    if (s.progressStart == null) {
        for (const note of s.errors) if (note.q) states.set(note.q, note.done ? 'mastered' : 'review');
    }
    for (const row of s.logs.slice(s.progressStart || 0)) if(states.get(row.q)!=='mastered')states.set(row.q,row.ok ? 'mastered' : 'review');
    return states;
}
function available(pool,s=S,review=false) {
    const states=questionStates(s);
    return pool.filter(q=>review ? states.get(q.id)==='review' : !states.has(q.id));
}
let temporaryRun=null;
const currentRun=(s=S)=>temporaryRun||s.practice;
function choosePool(pool,s,mode){
 if(mode==='错题复习')return available(pool,s,true);
 if(mode==='未做及待复习'){const states=questionStates(s);return pool.filter(q=>states.get(q.id)!=='mastered')}
 return available(pool,s);
}
function displaySession() {
    const run=currentRun();
    if (!run) {queue=[];qi=0;quizResult=null;return}
    queue=run.ids.map(id=>questionById.get(id));
    qi=run.index;batchId=run.id;quizScope=true;
    const attempts=S.logs.slice(S.progressStart || 0).filter(l=>l.batch===run.id);
    quizScore=attempts.filter(l=>l.ok).length;
    const row=attempts.find(l=>l.q===run.ids[qi]);
    quizResult=row ? {ok:row.ok,values:row.values,log:row.id}:null;
}
function requireSession(s) {
    const run=currentRun(s);
    if (!run || run.id!==batchId || run.index!==qi)
        throw Error('练习进度已更新，请回首页继续上次练习。');
}
async function startQuiz(pool,n=10,scope=false,label='题库训练',ordered=false,mode='仅未做题目') {
    const review=label==='错题复习';if(review)mode='错题复习';
    if (!choosePool(pool,S,mode).length) return toast(review?'暂无待复习错题':'该分类的题目已经全部练习完成。');
    let next;const previous=currentRun()?.id;
    if(previous && !confirm('开始另一组练习？已提交的答案会保留，未提交的题目可再次抽取。')) return;
    await change(s=>{
        if(currentRun(s)?.id!==previous)throw Error('练习已在其他窗口更新，请重新打开首页。');
        const eligible=choosePool(pool,s,mode);
        const ids=[...new Set((ordered?eligible:shuffle(eligible)).map(q=>q.id))].slice(0,n);
        if(!ids.length)throw Error('当前没有可练习的题目。');
        next={id:uid(),label,ids,index:0,mode};s.practice=pref().save?next:null;
    });
    temporaryRun=S.practice?null:next;displaySession();go('quiz');scheduleSync();
}
async function submitQuiz(){
    if(quizResult||!queue[qi])return;
    const q=queue[qi],values=readAnswers(q);
    if(!values.length||values.some(v=>!v))return toast('请先完成作答');
    const ok=checkQuestion(q,values);
    await change(s=>{
        requireSession(s);
        if(s.logs.some(l=>l.batch===batchId&&l.q===q.id))return;
        if(!choosePool([q],s,currentRun(s).mode||currentRun(s).label).length)throw Error('这道题的状态已更新。');
        s.logs.push({id:uid(),q:q.id,batch:batchId,at:now(),ok,values});
        let note=s.errors.find(e=>e.q===q.id);
        if(!note&&!ok){note={id:uid(),q:q.id};s.errors.push(note);Object.assign(note,{type:errorFor[q.cat]||'表达不准确',wrong:values.join(' / '),right:q.slots.map(x=>x.join(' / ')).join('；'),why:q.why,at:now()});}
        if(note)note.done=ok;
    });
    displaySession();render();scheduleSync();main.lastElementChild.scrollIntoView({block:'nearest'});
}
async function advance(){
    if(!quizResult)return;
    await change(s=>{
        requireSession(s);
        if(!temporaryRun&&++s.practice.index===s.practice.ids.length)s.practice=null;
    });
    if(temporaryRun&&++temporaryRun.index===temporaryRun.ids.length)temporaryRun=null;
    if(currentRun())displaySession();else{qi=queue.length;quizResult=null}
    render();scheduleSync();
}
async function resetPractice(all){
    if(!confirm(all?'将全部题目恢复为未练习，并结束当前练习。历史答题、作文和词汇会保留。':'结束本轮练习？已提交的结果保留，未提交的题目仍可练习。'))return;
    if(all&&!confirm('确认重新开始全部 '+questionById.size+' 道题的学习进度？当前待复习列表将清空。'))return;
    await change(s=>{if(all){s.progressStart=s.logs.length;if(s.cloud){s.cloud.reset=uid();s.cloud.known={}}};s.practice=null});
    temporaryRun=null;displaySession();go('home');scheduleSync();
}
function pendingErrors(){
    const states=questionStates(S),history=new Set([...S.errors.map(e=>e.q),...S.logs.filter(l=>!l.ok).map(l=>l.q)]);const due=available([...questionById.values()],S,true);const latest=new Map(S.logs.filter(l=>!l.ok).map(l=>[l.q,l.at]));due.sort((a,b)=>(latest.get(b.id)||'').localeCompare(latest.get(a.id)||''));
    const last=new Map(S.logs.map(l=>[l.q,l]));
    return topbar()+'<section class="card"><div class="row spread"><h2>待复习 · '+due.length+' 题</h2>'+
        (due.length?action('开始复习','review','primary'):'')+'</div>'+select('按题型查看','errorType',['全部',...new Set(due.map(kindOf))],errorType)+due.filter(q=>errorType==='全部'||kindOf(q)===errorType).map(q=>{
        const note=S.errors.find(r=>r.q===q.id);
        return '<details class="entry"><summary>'+esc(q.id+' · '+q.point)+'</summary><p>'+esc(q.text)+'</p><p>上次作答　'+esc(last.get(q.id)?.values.join(' / ')||note?.wrong)+'</p>'+action('重做此题','retry','',q.id)+courseLinks(q.id)+'</details>';
    }).join('')+(due.length?'':'<p>当前没有待复习的错题。</p>')+'</section><details class="card"><summary>已掌握的错题</summary>'+[...history].filter(id=>states.get(id)==='mastered').map(id=>'<p>'+esc(id+' · '+questionById.get(id).text)+'</p>').join('')+'</details><details class="card"><summary>历史答错记录</summary>'+S.logs.filter(l=>!l.ok).slice().reverse().map(l=>'<div class="entry"><strong>'+esc(l.q+' · '+questionById.get(l.q).point)+'</strong><p>'+esc(l.values.join(' / '))+'　·　'+dateStr(l.at)+'</p></div>').join('')+'</details><details class="card"><summary>错题笔记与旧记录</summary>'+records()+'</details>';
}
