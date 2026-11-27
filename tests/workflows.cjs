/* Logic-level integration tests. Node's real Web Storage and Web Locks, with
   lightweight controls in place of a rendered browser DOM. No network. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
if(!process.argv.includes('--child')){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wf-test-'));
    try{
        for(const phase of ['write','reopen']){
            const result=cp.spawnSync(process.execPath,['--experimental-webstorage','--localstorage-file='+path.join(dir,'db'),__filename,'--child',phase,dir],{stdio:'inherit'});
            if(result.status!==0)process.exitCode=1;
            if(result.status!==0)break;
        }
    }finally{fs.rmSync(dir,{recursive:true,force:true})}
}else run().catch(e=>{console.error(e);process.exitCode=1});
async function run(){
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',style:{setProperty(){}},dataset:{},classList:{remove(){},toggle(){}},lastElementChild:{scrollIntoView(){}},querySelector(){return null},setAttribute(){},addEventListener(){},scrollIntoView(){}});return nodes.get(id)}
const doc={getElementById:node,querySelector:node,body:node('body'),addEventListener(){}};
const ctx=vm.createContext({document:doc,window:{scrollTo(){}},navigator,localStorage,crypto,Date,console,TextDecoder,TextEncoder,Blob,Response,DecompressionStream,Uint8Array,DataView,confirm:()=>true,setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},structuredClone});
const bank=fs.readFileSync(root+'/web/bank.json','utf8');
const js=fs.readFileSync(root+'/dist/WriteFlow.html','utf8').split('<script>')[1].split('</script>')[0];vm.runInContext(js,ctx);
const ev=code=>vm.runInContext(code,ctx);await new Promise(setImmediate);
await ev('openDB();');await ev('(async()=>{S=await loadState();render()})()');
if(process.argv[3]==='reopen'){assert.equal(ev('S.essays[0].versions.length'),3);assert.equal(ev('S.prefs.theme'),'dark');assert.equal(ev('S.words[0].term'),'route');assert.equal(ev('S.logs.length'),4);await ev("act('resume')");assert(ev('quizResult.ok && queue.length===1'));console.log('Reopen in a new Node process: records, settings and versions survived');return}
assert(ev(`BANK.every(q=>[true,false].every(ok=>{
 const r={ok,values:q.slots.map(g=>ok?g[0]:'<wrong>')};
 const html=answerExplanation(q,r);
 return html.includes('为什么这样答')&&html.includes(esc(q.why))&&html.includes(esc(q.cn))&&!html.includes('<wrong>');
}))`));
ev("go('home')");
assert(node('main').innerHTML.includes('专项练习') && !node('main').innerHTML.includes('自由写作'));
assert(node('bottomTabs').innerHTML.includes('学习技巧'));
await ev("act('subject','阅读理解')");
ev("practiceLevel='3'");node('homeCount').value='7';
await ev("act('homeBegin')");
assert.equal(ev('queue.length'),7);
assert(ev("queue.every(q=>kindOf(q)==='阅读理解' && q.level===3)"));
assert(node('main').innerHTML.includes('data-a="back"'));
const runId=ev('currentRun().id');
ev('navigateBack()');assert.equal(ev('page'),'setup');
ev('navigateBack()');assert.equal(ev('page'),'home');
assert.equal(ev('currentRun().id'),runId);
ev('navigateBack();navigateBack()');assert.equal(ev('page'),'home');
ev('let exits=0;window.WriteFlowDevice={exitApp(){exits++}};navigateBack()');
assert.equal(ev('exits'),0);assert(node('notice').textContent.includes('再按一次'));
ev('exitDeadline=Date.now()-1;navigateBack()');assert.equal(ev('exits'),0);
ev("go('settings');navigateBack();navigateBack()");assert.equal(ev('exits'),0);
ev('navigateBack()');assert.equal(ev('exits'),1);
ev('delete window.WriteFlowDevice');
console.log('Back navigation passed: quiz/setup/home, session preservation, desktop home, Android timeout, re-entry and second press.');
await ev("go('home')");node('homeCount').value='0';await ev("act('homeBegin')");
assert.equal(ev('page'),'home');
for(const name of Object.keys(ev('pages'))){ev('go('+JSON.stringify(name)+')');assert(node('main').innerHTML.includes('<h1>'))}
ev("go('guided');topicFilters.genre='故事续写';chooseTopic(true)");
assert(ev("topicMeta.find(t=>t.index===promptIx.guided).genre==='故事续写'"));
assert.equal(ev('new Set(topicMeta.map(t=>t.title)).size'),100);
await ev("act('articleSet')");
assert([3,5].includes(ev('queue.length')));
assert.equal(ev('new Set(queue.map(q=>q.article)).size'),1);
assert(node('main').innerHTML.includes('第 2 空'));
for(let i=0;i<ev('queue[0].slots.length');i++)node('ans'+i).value=ev('queue[0].slots['+i+'][0]');
assert(ev('checkQuestion(queue[0],readAnswers(queue[0]))'));
await ev("startQuiz(BANK.filter(q=>q.kind==='短文'),2);");node('ans0').value='wrong';node('ans1').value='wrong';await ev('submitQuiz()');assert.equal(ev('S.logs.length'),1);assert.equal(ev('S.errors.length'),1);
const failed=ev('queue[qi].id');ctx.failed=failed;
assert(ev("available(BANK).every(q=>q.id!==failed)"));
await ev("act('resetCurrent')");assert.equal(ev('S.practice'),null);
assert.equal(ev("available(BANK,S,true).length"),1);
await ev("act('review')");node('ans0').value='wrong';node('ans1').value='wrong';await ev('submitQuiz()');
assert.equal(ev("available(BANK,S,true).length"),1);
await ev("act('next')");await ev("act('review')");
for(let i=0;i<ev('queue[0].slots.length');i++)node('ans'+i).value=ev('queue[0].slots['+i+'][0]');
await ev('submitQuiz()');assert.equal(ev("available(BANK,S,true).length"),0);
assert.equal(ev("questionStates(S).get(failed)"),'mastered');
await ev("act('next')");await ev("startQuiz([questionById.get(failed)],1)");assert.equal(ev("S.practice"),null);
assert.equal(ev("available(BANK).length"),2999);
ctx.confirm=()=>false;await ev("act('resetProgress')");assert.equal(ev("available(BANK).length"),2999);
let confirmations=0;ctx.confirm=()=>++confirmations===1;await ev("act('resetProgress')");assert.equal(confirmations,2);assert.equal(ev("available(BANK).length"),2999);
ctx.confirm=()=>true;await ev("act('resetProgress')");assert.equal(ev("available(BANK).length"),3000);assert.equal(ev('S.logs.length'),3);
await ev("startQuiz([questionById.get(failed),questionById.get(failed)],5)");assert.equal(ev('queue.length'),1);
for(let i=0;i<ev('queue[0].slots.length');i++)node('ans'+i).value=ev('queue[0].slots['+i+'][0]');
await ev('submitQuiz()');await ev('submitQuiz()');assert.equal(ev('S.logs.length'),4);assert.equal(ev('available(BANK).length'),2999);
ev("qFilter={cat:'冠词',level:'3',mode:'选择'}");assert.equal(ev('filterBank().length'),8);
ev("go('free')");node('wTitle').value='Lake';node('wBody').value='We walk home.';await ev('saveDraft()');assert.equal(ev("S.drafts['free:0'].body"),'We walk home.');await ev('saveWriting()');
node('wBody').value='We walked home.';node('stage').value='Revised';node('vNote').value='Past tense';await ev('saveWriting()');
node('wBody').value='Yesterday we walked home.';node('stage').value='Final';await ev('saveWriting()');assert.equal(ev('S.essays[0].versions[0].body'),'We walk home.');assert(ev("diff('We walk home.','We walked home.').includes('<del>walk</del>')"));
ev("go('words')");node('r_term').value='route';node('r_meaning').value='路线';await ev('saveRecord()');await ev("act('editRecord',S.words[0].id)");node('r_note').value='travel';await ev('saveRecord()');await ev("act('toggleStar',S.words[0].id)");assert(ev("S.words[0].star && S.words[0].note==='travel'"));
assert.equal(ev('fresh().prefs.theme'),'mist');
for(const [label,value] of [['Morning Mist（晨雾蓝）','mist'],['白色','white'],['暖纸色','paper'],['深色','dark']]){ev("go('settings')");node('theme').value=label;node('font').value='18';node('goal').value='32';await ev("act('prefs')");assert.equal(doc.body.dataset.theme,value)}
const legacy=ev('JSON.stringify(S)');const old=JSON.parse(legacy);delete old.practice;delete old.progressStart;
ctx.old=old;assert(ev('validateState(old) && questionStates(old).get(old.logs[0].q)==="mastered"'));
await ev("change(s=>s.prefs.training={save:false,random:false,number:20,level:'2',resume:false})");
const savedForTemporary=ev('JSON.stringify(S)');
await ev("startQuiz(BANK.filter(q=>q.kind==='短文'),2,true,'临时训练',true)");
assert.equal(ev('S.practice'),null);assert.equal(ev('temporaryRun.ids.length'),2);
for(let i=0;i<ev('queue[0].slots.length');i++)node('ans'+i).value=ev('queue[0].slots['+i+'][0]');
await ev('submitQuiz()');assert(ev('quizResult.ok'));await ev('advance()');assert.equal(ev('temporaryRun.index'),1);
assert.equal((await ev('loadState()')).practice,null);
ctx.savedForTemporary=savedForTemporary;await ev('restoreFile(new Blob([savedForTemporary]))');
const snapshot=ev('JSON.stringify(validateState(S))');
ctx.legacyFile=new Blob([legacy]);ctx.oldFile=new Blob([JSON.stringify(old)]);
await ev('restoreFile(oldFile)');
assert.equal(ev('S.practice'),null);assert.equal(ev('S.progressStart'),null);
assert.equal(ev('S.logs.length'),4);assert.equal(ev('S.words.length'),1);
assert.equal(ev('S.essays[0].versions.length'),3);assert.equal(ev('S.errors.length'),1);
assert.equal(ev('questionStates(S).get(S.logs[0].q)'),'mastered');
await ev("startQuiz(BANK.filter(q=>q.kind==='短文'),2)");
const beforeReset=ev('JSON.stringify([S.logs,S.errors,S.words,S.essays,S.prefs])');
await ev("act('resetProgress')");assert.equal(ev('JSON.stringify([S.logs,S.errors,S.words,S.essays,S.prefs])'),beforeReset);
assert.equal(ev('available(BANK).length'),3000);assert.equal(ev('S.practice'),null);
await ev("startQuiz(BANK.filter(q=>q.kind==='短文'),3)");
const set=Array.from(ev('queue.map(q=>q.id)'));assert.equal(new Set(set).size,3);
for(let i=0;i<ev('queue[0].slots.length');i++)node('ans'+i).value=ev('queue[0].slots['+i+'][0]');
await ev('submitQuiz()');await ev('advance()');
for(let i=0;i<ev('queue[1].slots.length');i++)node('ans'+i).value='incorrect';
await ev('submitQuiz()');await ev('advance()');
await ev("act('resetCurrent')");ctx.setIds=set;
assert(ev("questionStates(S).get(setIds[0])==='mastered' && questionStates(S).get(setIds[1])==='review' && !questionStates(S).has(setIds[2])"));
await ev('startQuiz(setIds.map(id=>questionById.get(id)),5)');assert.equal(ev('queue.length'),1);assert.equal(ev('queue[0].id'),set[2]);

assert.throws(()=>ev('validateState({schema:1})'));await ev("act('clear')");assert.equal(ev('S.logs.length'),0);
ctx.backup=new Blob([snapshot]);await ev('restoreFile(backup)');assert.equal(ev('S.logs.length'),4);
ctx.file={name:'Notes.txt',size:24,text:async()=>'Text across\ntwo lines.'};await ev('importEssay(file)');assert.equal(ev('S.essays.at(-1).versions[0].body'),'Text across\ntwo lines.');await ev("act('deleteEssay')");assert.equal(ev('S.essays.length'),1);
const body='A & B < together\nSecond paragraph. 中文',blob=await ev('makeDocx('+JSON.stringify(body)+')'),dir=process.argv[4];fs.writeFileSync(path.join(dir,'out.docx'),Buffer.from(await blob.arrayBuffer()));
const py=cp.spawnSync('python3',[path.join(root,'tests/wordcheck.py'),dir,body],{encoding:'utf8'});assert.equal(py.status,0,py.stderr);
// A Python ElementTree adapter supplies DOMParser's document/paragraph accessors in Node.
ctx.DOMParser=class{parseFromString(xml){let r=cp.spawnSync('python3',['-c','import sys,json,xml.etree.ElementTree as E; root=E.fromstring(sys.stdin.read()); ns="{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"; print(json.dumps([[(t.tag.split("}")[-1],t.text or "") for t in p.iter()] for p in root.iter(ns+"p")]))'],{input:xml,encoding:'utf8'});assert.equal(r.status,0,r.stderr);let paras=JSON.parse(r.stdout).map(tags=>({getElementsByTagNameNS:()=>tags.map(([localName,textContent])=>({localName,textContent}))}));return {getElementsByTagName:()=>[],getElementsByTagNameNS:()=>paras}}};
for(const f of ['out.docx','compressed.docx']){let b=fs.readFileSync(path.join(dir,f));ctx.wordBytes=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);assert.equal(await ev('readDocx(wordBytes)'),body)}
console.log('Workflow checks passed: 13 page render functions, filters, grading, notebook CRUD, drafts, versions, diff, words, themes, settings, backup/restore, TXT and stored/deflated DOCX');
}
