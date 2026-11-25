// Feedback is built only after submission. All curriculum and learner text is escaped.
const grammarGuides = [
 [/过去完成|had done/, '先确定过去的参照点，再找更早发生的动作。更早的一步用 had + 过去分词，先后关系比句子中的排列顺序更重要。'],
 [/现在完成|have done|has done/, '检查动作与现在的联系。have 或 has 承担时态，后面的实义动词用过去分词；since 引出起点，for 引出时长。'],
 [/过去进行|现在进行|进行时/, '先找“正在发生”的参照时刻，再选择 be 的时态和单复数。动作本身写成 -ing 形式。'],
 [/过去式|一般过去/, '先用时间线确认动作已经发生。肯定句的实义动词负责标记过去；若已有 did，则后面的动词回到原形。'],
 [/一般现在|第三人称单数|三单/, '先找主语，再看是否已有助动词。一般现在时肯定句中，第三人称单数的实义动词通常加 -s 或 -es；does 后用原形。'],
 [/情态|can 后|may 后|must 后|could 后|would 后|should 后/, '情态动词承担语气，紧跟它的动词用原形。若要表达被动，原形的位置由 be 占据，再接过去分词。'],
 [/被动|被展示|被制造/, '判断主语是执行者还是承受者。被动结构用 be + 过去分词，时态和主谓一致体现在 be 上。'],
 [/虚拟|反事实/, '区分假设的时间和说话的时间。与现在事实相反常用过去式；与过去事实相反常用 had + 过去分词。'],
 [/倒装/, '把句子还原为普通陈述语序，找出主语和谓语，再检查需要前置的是哪一个助动词。使用 did 后，实义动词用原形。'],
 [/主谓|中心词|主语.*单数|主语.*复数/, '把介词短语、插入语或修饰语暂时移开，先找主语中心，而后决定谓语的数。靠近谓语的名词未必是主语。'],
 [/动名词|介词后/, '先看前一个词要求什么成分。介词后若表示一个动作，通常用 -ing；to 若是介词，后面也遵循这一规则。'],
 [/宾格|主格|物主|所属|代词/, '先找代词指谁，再判断它作主语、宾语还是表示所属。表示所属时，还要看后面是否紧跟被修饰的名词。'],
 [/比较级|最高级|原级/, '圈出比较的对象和范围。than 常连接比较对象，as…as 中间用原级；最高级表示一个范围内程度最高。'],
 [/冠词|元音音素/, '先判断是否特指以及名词是否为可数单数。用不定冠词时听后一个词的起始音，元音音素前用 an。'],
 [/可数|名词复数|不可数/, '数量词和名词要配套：many、few 修饰可数复数，much、little 修饰不可数名词。量词短语还要看被计数的是单位还是物品。'],
 [/定语从句|关系代词|先行词/, '先找到被修饰的名词，再看从句缺什么。缺主语、宾语与缺所属限定语，所需的关系词不同。'],
 [/从句|连接词/, '先划分主句和从句，再判断两部分表达时间、条件、原因还是让步。仅凭两个分句在中文中的先后顺序，不能确定连接词。'],
 [/介词/, '先判断空格连接的是时间、位置、方向，还是动词规定的搭配。将前后两侧连成一个短语核对，避免按中文逐字对应。']
];
function answerExplanation(q,res){
 const kind=kindOf(q),keys=q.slots.map(g=>g[0]),values=res.values||[],facts=[...(teachingNotes[q.id]||[])];
 if(q.cat==='介词'){
   const meanings={from:'from 标出起点或来源；如果后面还有 to，两者共同标出一个范围。',during:'during 后接表示时段或事件的名词短语；while 通常引出有主语和谓语的从句。',between:'between 关注可分别辨认的对象之间的关系；among 更常把参与者看作一个群体。',through:'through 强调穿过内部或经过一个过程；across 强调从一侧到另一侧。',since:'since 标出持续状态的起点；for 后接持续了多久。',until:'until 标明动作或状态延续到的界限；by 表示最迟要在某时完成。',by:'by 可以引出方式、施动者或时间界限。判断本句要表达哪一层关系，再与旁边的名词连读。'};
   if(meanings[keys[0]])facts.push(meanings[keys[0]]);
 }
 if(kind==='句子排序'&&keys.length>1){
   facts.push('先连读相邻词块：“'+keys[0]+' '+keys[1]+'”。再检查末尾“'+keys.at(-1)+'”修饰哪一部分；中文的语序可能与英文不同。');
 }
 if(kind==='句子配对')facts.push(...q.pairsLeft.map((prompt,i)=>prompt+' → '+keys[i]));
 if(kind==='句型转换')facts.push('题目要求：'+q.hint+' 对比改写前后的主语、谓语和时间信息，确认改动只服务于指定句型。');
 const notes=grammarGuides.find(([rule])=>rule.test(q.point+' '+q.why.split('完整')[0]));
 if(notes&&!['阅读理解','段落排序'].includes(kind))facts.push(notes[1]);
 const lines=(list)=>list.map(x=>'<p>'+esc(x)+'</p>').join('');
 let worked='';
 const blanks=q.text.match(/_{2,}/g)||[];
 if(blanks.length===keys.length){
   let i=0;worked=q.text.replace(/_{2,}/g,()=>keys[i++]).replace(/Ø\s*/g,'');
 }else if(['句子排序','段落排序'].includes(kind))worked=keys.join(kind==='段落排序'?'\n\n':' ');
 else if(kind==='句型转换')worked=q.text+'　→　'+keys[0];
 else if(kind==='句子改错'){
   const target=q.hint.match(/将 (.+?) 改为/);
   if(target&&q.text.includes(target[1]))worked=q.text.replace(target[1],keys[0]);
 }
 if(kind==='阅读理解'&&!facts.length){
   const stem=q.text.split('\n\n')[0];
   const sentences=stem.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
   const match=sentences.find(s=>keys[0].length>4&&s.toLowerCase().includes(keys[0].toLowerCase().replace(/[.!?]$/,'')));
   if(match)facts.push('原文用语：'+match.trim());
   else facts.push('把选项“'+keys[0]+'”与全文译意对照：核查它所说的人、动作和范围是否都有依据，尤其留意选项是否把可能发生的事说成了确定事实。');
 }
 if(q.tip&&!/^(复核自己的答案|核对上下文，再读|先看题目)/.test(q.tip)&&q.tip!==q.why)facts.push(q.tip);
 let comparison='';
 if(kind==='多项选择'){
   const missing=q.slots.filter(group=>!values.some(v=>group.some(a=>norm(a)===norm(v)))).map(g=>g[0]);
   const extra=values.filter(v=>!q.slots.some(g=>g.some(a=>norm(a)===norm(v))));
   comparison=lines([missing.length?'漏选：'+missing.join('；'):'',extra.length?'多选：'+extra.join('；'):''].filter(Boolean));
 }else if(keys.length>1||(!res.ok&&!res.selfAssessed)){
   comparison=q.slots.map((group,i)=>{
     const ok=group.some(a=>norm(a)===norm(values[i]));
     const label=kind==='句子配对'?q.pairsLeft[i]:keys.length===1?'本题':(isOrdered(q)?'第 '+(i+1)+' 位':'第 '+(i+1)+' 空');
     return '<p><strong>'+esc(label)+'</strong>　'+(ok?'✓ '+esc(values[i]):'你的答案：'+esc(values[i])+'　→　参考答案：'+esc(group[0]))+'</p>';
   }).join('');
 }
 const others=q.slots.flatMap((g,i)=>g.length>1?[(keys.length>1?'第 '+(i+1)+' 项：':'')+g.slice(1).join(' / ')]:[]);
 const details=[...new Set(facts)].filter(f=>f!==q.why);
 return '<section class="answer-detail"><h3>为什么这样答</h3>'+lines(details.length?[details[0],q.why]:[q.why])+
 (details.length>1?'<details><summary>进一步理解与易错点</summary>'+lines(details.slice(1))+'</details>':'')+
 (worked&&!q.why.includes(worked)?'<h4>完整表达</h4><p class="preserve" lang="en">'+esc(worked)+'</p>':'')+
 (comparison?'<h4>作答对照</h4>'+comparison:'')+
 (others.length?'<h4>其他可接受答案</h4>'+lines(others):'')+'<h4>中文对照</h4>'+lines([q.cn])+'<p class="meta">知识点　'+esc(q.point)+'</p></section>';
}
