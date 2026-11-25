const legacyKinds={'选择':'单项选择','输入':'单词拼写','词形':'动词变形','短文':'短文完形'};
const kindOf=q=>legacyKinds[q.kind]||q.kind;
const kindOrder=['表达选择','单项选择','多项选择','单词拼写','语境选词','动词变形','句子填空','短文完形','句子排序','句子改错','句型转换','中译英','英译中','句子配对','段落排序','阅读理解'];
const isOrdered=q=>['句子排序','段落排序','句子配对'].includes(kindOf(q));
function checkQuestion(q,values){
    if(kindOf(q)!=='多项选择')return grade(q.slots,values);
    const selected=new Set(values.map(norm));
    return selected.size===q.slots.length&&q.slots.every(group=>group.some(x=>selected.has(norm(x))));
}
function answerControls(q,result){
    const values=result?.values||[];
    if(q.wordBank||q.slotOptions)return q.slots.map((_,i)=>'<label>第 '+(i+1)+' 空<select required id="ans'+i+'"><option value="">请选择</option>'+opt(q.slotOptions?.[i]||q.wordBank,values[i])+'</select></label>').join('');
    if(isOrdered(q))return q.slots.map((_,i)=>{
        const label=kindOf(q)==='句子配对'?q.pairsLeft[i]:'第 '+(i+1)+' 位';
        return '<label>'+esc(label)+'<select required id="ans'+i+'"><option value="">请选择</option>'+opt(q.options,values[i])+'</select></label>';
    }).join('');
    if(q.options.length){
        const multiple=kindOf(q)==='多项选择';
        return '<div role="'+(multiple?'group':'radiogroup')+'" aria-label="备选答案">'+q.options.map(o=>'<label class="choice"><input name="answer" type="'+(multiple?'checkbox':'radio')+'" value="'+esc(o)+'" '+(values.includes(o)?'checked':'')+'>'+esc(o)+'</label>').join('')+'</div>';
    }
    return q.slots.map((_,i)=>field(q.slots.length>1?'第 '+(i+1)+' 空':'你的答案','ans'+i,values[i]||'',true)).join('');
}
function readAnswers(q){
    if(!isOrdered(q)&&q.options.length)return Array.from(main.querySelectorAll('[name=answer]:checked'),e=>e.value);
    return q.slots.map((_,i)=>el('ans'+i).value.trim());
}
async function acceptTranslation(){
    const q=queue[qi],r=quizResult;
    if(!r||r.ok||!['中译英','英译中'].includes(kindOf(q)))return;
    await change(state=>{requireSession(state);const row=state.logs.find(item=>item.id===r.log);if(!row)throw Error('未找到本次答题记录');row.ok=true;row.selfAssessed=true;const note=state.errors.find(e=>e.q===q.id);if(note)note.done=true});
    quizScore++;r.ok=true;r.selfAssessed=true;render();
}
