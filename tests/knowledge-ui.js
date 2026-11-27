// UI regression fixture. Append only in an isolated test document and local profile.
(async()=>{
 try{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<300&&!S;i++)await sleep(30);
 function check(ok,msg){if(!ok)throw Error(msg)}
 const visible=()=>check(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow '+page);
 async function click(sel){const target=Array.from(document.querySelectorAll(sel)).find(e=>e.getClientRects().length && e.getBoundingClientRect().width>0);check(target,'no '+sel);target.click();for(let i=0;i<300&&busy;i++)await sleep(30);visible()}
 await click('[data-v="knowledge"]');check(main.innerText.includes('词根词缀'),'modules');
 await click('[data-a="kGroup"][data-v=""]');
 const search=el('kQuery');search.value='relative clauses';search.dispatchEvent(new Event('input',{bubbles:true}));check(el('kRows').innerText.includes('定语从句'),'bilingual search');
 await click('[data-a=kRead]');await click('[data-a=kStar]');await click('[data-a=kDone]');check(main.innerText.includes('已学完'),'reading state');
 await click('[data-a=kTry]');const q=queue[qi],qid=q.id;
 main.querySelectorAll('[name=answer]').forEach(x=>x.checked=x.value!==q.slots[0][0]);await click('#quizForm button');
 check(quizResult&&!quizResult.ok,'wrong grade');await click('[data-a=next]');check(main.innerText.includes('重看讲解'),'return');
 go('errors');check(main.innerText.includes('定语从句'),'error entry');const entry=main.querySelector('details.entry');if(entry)entry.open=true;await click('[data-a=retry]');main.querySelectorAll('[name=answer]').forEach(x=>x.checked=x.value===q.slots[0][0]);await click('#quizForm button');check(quizResult.ok,'review grade');await click('[data-a=next]');check(questionStates(S).get(qid)==='mastered'&&!available([q]).length,'mastered exclusion');
 check(validateState(JSON.parse(JSON.stringify(S))),'backup');
 go('knowledge');await click('[data-a=kGroup][data-v=forms]');el('kQuery').value='gone';el('kQuery').dispatchEvent(new Event('input',{bubbles:true}));check(el('kRows').innerText.includes('go'),'gone index');
 await click('[data-a=kMix]');check(queue.length===10&&queue.filter(q=>courseById.get(q.knowledge).section.includes('不规则')).length===6,'mix');
 for(const q of curriculum.questions){
  check(checkQuestion(q,q.slots.map(g=>g[0])),'key '+q.id);check(!checkQuestion(q,['wrong-answer']),'invalid '+q.id);
  for(const ok of [true,false]){const out=answerExplanation(q,{ok,values:[ok?q.slots[0][0]:'wrong-answer']});check(out.includes(esc(q.why))&&out.includes(esc(q.cn)),'feedback '+q.id)}
 }
 const saved=await loadState();check(Object.values(saved.knowledge).some(r=>r.star&&r.read),'saved favorites');
 go('knowledge');if(innerWidth<700)await knowledgeAction('kRead','grammar-relative-clauses');window.scrollTo(0,0);document.title='PASS-'+innerWidth+'x'+innerHeight;
 }catch(e){document.title='FAIL-'+e.message;document.body.textContent=document.title}
})();
