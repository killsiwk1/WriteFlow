const schoolGroups={grammar:['语法知识','从生活情境读懂句子结构和时态。'],morph:['词根词缀','拆开单词，在句子里验证词义。'],forms:['单词变化','对照规则拼写与不规则形式。']};
Object.assign(pages,{knowledge:{n:'知识学习'},library:{n:'知识目录'},reader:{n:'知识讲解'}});
navigation.splice(1,0,['knowledge','知识学习','M3 4q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1z M12 5v14']);
const courseById=new Map(curriculum.lessons.map(l=>[l.id,l]));
const relatedCourses=new Map();
for(const l of curriculum.lessons)for(const id of l.ids){
 if(!relatedCourses.has(id))relatedCourses.set(id,[]);
 relatedCourses.get(id).push(l);
}
let subjectGroup='',currentCourse=curriculum.lessons[0].id,kQuery='',kFilter='全部',kSection='全部';
function kStatus(l,states){
 const rec=S.knowledge?.[l.id];
 if(l.ids.every(id=>states.get(id)==='mastered'))return '已掌握';
 if(rec?.read)return '已学完';
 return rec?.visited || l.ids.some(id=>states.has(id))?'学习中':'未学习';
}
function latestCourse(items){return items.filter(l=>S.knowledge?.[l.id]?.visited).sort((a,b)=>S.knowledge[b.id].visited.localeCompare(S.knowledge[a.id].visited))[0]}
function kHome(){
 const states=questionStates(S);
 return topbar()+Object.entries(schoolGroups).map(([k,[title,desc]])=>{
 const ls=curriculum.lessons.filter(l=>l.group===k),started=ls.filter(l=>kStatus(l,states)!=='未学习').length,mastered=ls.filter(l=>kStatus(l,states)==='已掌握').length,last=latestCourse(ls);
 return '<section class="setting"><h2>'+title+'</h2><p>'+desc+'</p><p class="mut">共 '+ls.length+' 课 · 已学习 '+started+' · 已掌握 '+mastered+'</p><progress value="'+mastered+'" max="'+ls.length+'"></progress><div class="row">'+action('查看课程','kGroup','',k)+(last?action('继续学习 · '+last.name,'kRead','quiet',last.id):'')+'</div></section>'
 }).join('')+action('搜索全部知识','kGroup','quiet','');
}
function kItems(){return curriculum.lessons.filter(l=>!subjectGroup||l.group===subjectGroup)}
function kRows(){
 const states=questionStates(S),query=kQuery.trim().toLowerCase();
 const ls=kItems().filter(l=>(kSection==='全部'||l.section===kSection)&&[l.name,l.en,l.keywords,l.rule].join(' ').toLowerCase().includes(query)&&(kFilter==='全部'||kStatus(l,states)===kFilter||kFilter==='收藏'&&S.knowledge?.[l.id]?.star||kFilter==='薄弱'&&l.ids.some(id=>states.get(id)==='review')));
 return ls.map(l=>'<button type="button" class="k-item" data-a="kRead" data-v="'+l.id+'"><strong>'+esc(l.name)+'</strong><small>'+esc(l.en)+' · '+kStatus(l,states)+'</small></button>').join('')||'<p>没有匹配的知识点。</p>';
}
function verbTable(){
 const rows=kItems().filter(l=>l.forms&&(!kQuery||[...l.forms,l.meaning].join(' ').includes(kQuery.toLowerCase()))&&(kSection==='全部'||l.section===kSection));
 if(!rows.length)return '';
 return '<details class="setting"><summary>不规则动词三态对照</summary><table class="k-verbs"><thead><tr><th>原形</th><th>过去式</th><th>过去分词</th></tr></thead><tbody>'+rows.map(l=>'<tr><td>'+action(l.name,'kRead','quiet',l.id)+'</td><td>'+esc(l.forms[1])+'</td><td>'+esc(l.forms[2])+'</td></tr>').join('')+'</tbody></table></details>';
}
function kLibrary(){
 return '<h1>'+esc(schoolGroups[subjectGroup]?.[0]||'全部知识')+'</h1>'+field('搜索中文、英文或变化形式','kQuery',kQuery)+'<div class="pair">'+select('分类','kSection',['全部',...new Set(kItems().map(l=>l.section))],kSection)+select('学习状态','kFilter',['全部','未学习','学习中','已学完','已掌握','收藏','薄弱'],kFilter)+'</div>'+(subjectGroup==='forms'?action('规则与不规则混合练习','kMix')+'<div id="kTable">'+verbTable()+'</div>':'')+'<div id="kRows">'+kRows()+'</div>';
}
function kExample(text){return esc(text).replace(/\[([^\]]+)\]/g,'<strong>$1</strong>')}
function kReader(){
 const l=courseById.get(currentCourse),rec=S.knowledge?.[l.id]||{},states=questionStates(S);
 const missed=l.ids.filter(id=>states.get(id)==='review'),due=missed.length;
 const reviewNotes=missed.map(id=>{const q=questionById.get(id);return '<section class="entry"><p>'+esc(q.text)+'</p><p>参考答案　'+esc(q.slots.map(a=>a.join(' / ')).join('；'))+'</p><p>'+esc(q.why)+'</p></section>'}).join('');
 const analysis=(l.analysis||[]).map(([phrase,role])=>'<span class="k-piece"><b lang="en">'+esc(phrase)+'</b><small>'+esc(role)+'</small></span>').join('');
 const siblings=curriculum.lessons.filter(item=>item.section===l.section&&item.group===l.group);
 const next=siblings[siblings.indexOf(l)+1];

 const samples=l.ids.filter(id=>!id.startsWith('K-') || id.includes('-practice')).filter(id=>questionById.get(id).text.includes('____')).slice(0,3).map(id=>{const q=questionById.get(id);let i=0;return '<p lang="en">'+esc(q.text.replace(/_{2,}/g,()=>q.slots[i++]?.[0]||'____'))+'</p><p>'+esc(q.cn)+'</p><small>'+esc(q.why)+'</small>'}).join('');
 return '<p class="mut">'+esc(l.section)+' · '+kStatus(l,states)+'</p><h1>'+esc(l.name)+'</h1><p>'+esc(l.group==='morph'?l.section+' · '+l.keywords.split(' ')[0]:l.en)+'</p><article class="sheet reading">'+(l.scene!==l.cn?'<p>'+esc(l.scene)+'</p>':'')+'<blockquote lang="en">'+kExample(l.example)+'</blockquote><p>'+esc(l.cn)+'</p><h2>观察与拆解</h2>'+(analysis?'<div class="k-pieces">'+analysis+'</div>':'')+'<p>'+esc(l.rule)+'</p><h3>对照着记</h3><p>'+esc(l.error)+'</p>'+(samples?'<details><summary>再看几个例子</summary>'+samples+'</details>':'')+(due?'<details><summary>本课待复习的题目（'+due+'）</summary>'+reviewNotes+'</details>':'')+'</article><div class="row">'+action('学完就试试 · 1 题','kTry','primary')+action('专项练习','kDrill')+(due?action('复习本课错题 · '+due,'kReview'):'')+'</div><div class="row">'+action(rec.star?'取消收藏':'收藏','kStar',rec.star?'quiet starred':'quiet')+action(rec.read?'已读完':'标记已读完','kDone','quiet')+(next?action('下一课 · '+next.name,'kRead','quiet',next.id):'')+'</div>';
}
function courseLinks(id){return (relatedCourses.get(id)||[]).map(l=>action('重看讲解 · '+l.name,'kRead','quiet',l.id)).join('')}
async function knowledgeAction(a,v){
 if(a==='kGroup'){subjectGroup=v;kQuery='';kFilter=kSection='全部';go('library');return}
 if(a==='kMix'){const pool=available(curriculum.questions.filter(q=>q.knowledge.startsWith('forms-'))),irr=pool.filter(q=>courseById.get(q.knowledge).section.includes('不规则')),regular=pool.filter(q=>!irr.includes(q));await startQuiz(shuffle([...shuffle(irr).slice(0,6),...shuffle(regular).slice(0,4)]),10,true,'词形混合训练',true);return}
 if(a==='kRead'){if(!courseById.has(v))return;currentCourse=v}
 const l=courseById.get(currentCourse);
 if(['kRead','kStar','kDone'].includes(a)){await change(s=>{s.knowledge||={};const r=s.knowledge[l.id]||={};if(a==='kRead')r.visited=now();else if(a==='kStar')r.star=!r.star;else r.read=true});if(a==='kRead')go('reader');else render();return}
 await startQuiz(l.ids.map(id=>questionById.get(id)),a==='kTry'?1:10,true,a==='kReview'?'错题复习':l.name,true);
}
