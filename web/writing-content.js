const genreLessons = [
['电子邮件','Subject and purpose','用主题行点明来意；第一段写希望收件人做什么。','Could you confirm the meeting time?'],
['书信','News from home','先回应上封信，再用一件具体的小事介绍近况，结尾问候。','Your last letter reminded me of our first trip.'],
['邀请信','An invitation','交代活动、时间、地点，再说明对方为何会感兴趣和如何回复。','Let me know by Friday if you can come.'],
['感谢信','A small kindness','写清谁做了什么，以及这件事具体改变了什么。','Your map helped us find the entrance.'],
['道歉信','Making things right','承认具体疏忽，解释原因，提出可以兑现的补救办法。','I can bring a replacement tomorrow.'],
['建议信','One change to try','描述读者遇到的困难；给出可执行的建议并解释理由。','You could start with a shorter route.'],
['求助信','A request for help','说明已经试过什么，再提出一个清楚、具体的问题。','Could you show me how to check the result?'],
['申请信','Applying for a role','说明申请的岗位，用一件经历证明自己符合要求。','Last term I helped organize a similar event.'],
['通知','A change of plan','先说明谁受影响，再列出新安排和必须采取的行动。','Please meet at the side entrance instead.'],
['日记','Looking back','写日期，用过去时叙事，结尾写现在的感受。','At first I felt nervous, but then I heard a familiar voice.'],
['演讲稿','A question for the audience','用听众熟悉的问题开场，讲一个实例，最后提出行动。','Have you ever had to change your plan?'],
['海报和活动介绍','Join us','用短标题吸引目标读者，突出活动亮点和报名方式。','Bring a friend and sign up at the desk.'],
['个人经历','Something I tried','按起因、尝试、结果组织，用一个动作展现变化。','I tried again, this time with a smaller group.'],
['人物介绍','Someone worth meeting','选一种人物特质，用可观察的行为和事例说明。','She always stays until the last chair is put away.'],
['地点介绍','A place to visit','按游览顺序介绍位置、特色和实用信息。','Just beyond the gate you will find a quiet garden.'],
['事件描述','What happened','交代时间地点，用事件先后顺序说明结果。','By the time we arrived, the room was full.'],
['图片描述','Inside the frame','从整体场景写到人物动作，用位置词说明关系。','In the foreground, two students are sharing a map.'],
['故事续写','What came next','接住已有线索，保持叙事人称和时态，让人物选择推动结局。','Only then did I notice the name on the back.'],
['观点表达','My position','先表态，再用理由和例子支持，结尾回应题目。','I support the idea because it gives everyone a chance.'],
['利弊分析','Two sides','从同一对象的两个方面分析得失，并说明适用条件。','It saves time, although it takes practice.'],
['问题与解决办法','A workable solution','分析一个具体原因，把措施和这个原因对应起来。','A second sign would help visitors find the room.'],
['个人建议','A practical next step','从对方的条件出发，说明先做哪一步以及怎样判断效果。','Try it for a week and record what changes.'],
['事物比较','Choosing between two options','确定共同的比较标准，逐项比较后作出选择。','Both routes are short, but only one has a bike lane.'],
['现象分析','Behind a change','描述观察，区分事实与推测，再解释一种可能原因。','One possible explanation is the later opening time.']
];
const topicScenes = [
['家庭阅读角','A family reading corner','shelf, borrow, share'],['校园运动日','School sports day','team, relay, practice'],['家乡步行游','A hometown walking tour','route, guide, landmark'],['社区旧物交换','A neighborhood swap','exchange, repair, reuse'],['朋友的摄影展','A friend’s photo show','portrait, light, display'],['节日聚餐','A festival meal','recipe, tradition, prepare'],['公交站志愿服务','Helping at a bus stop','passenger, direction, volunteer'],['班级节水周','Saving water at school','tap, measure, waste']
];
for(const [g,english,guide,example] of genreLessons){
 topicScenes.forEach(([topic,title,keys],i)=>{
   const level=1+i%5;
   prompts.guided.push([g+' · '+topic,english+' — '+title,topic+'｜'+g+'｜Level '+level+'｜建议 '+(45+level*15)+'–'+(65+level*15)+' 词。围绕“'+topic+'”自拟具体的人物和情境。'+guide+' 关键词：'+keys+'。','',guide+' 可借鉴的表达：'+example]);
 });
}
function writingTips(){
 return '<section class="card"><h2>从审题到定稿</h2>'+[
 ['审题','圈出收件人、目的和必须写到的要点。若要求邀请朋友并说明交通方式，先把这两项列在草稿上。'],
 ['结构','先写一句说明来意。正文每段回答一个问题，结尾告诉读者下一步。80 词的邀请信可用约 15 词开场、50 词交代安排、15 词请对方回复。'],
 ['表达','用 because 引出原因，用 so 说明结果。比较两种选择时先写共同点，再用 however 引出差异。'],
 ['扩句','从 We met. 开始，加上地点和目的：We met outside the library to plan the trip. 新信息应帮助读者理解事件。'],
 ['检查','逐条核对任务要求。圈出每个谓语，检查时态和主谓一致；再看可数名词、冠词、介词、拼写和句末标点。朗读一遍，检查代词指向谁。']
 ].map(([t,b])=>'<h3>'+t+'</h3><p>'+b+'</p>').join('')+'</section><section class="card"><h2>按文体学习</h2>'+genreLessons.map(([t,,g,e])=>'<details><summary>'+t+'</summary><p>'+g+'</p><p lang="en">'+e+'</p></details>').join('')+'</section>'+modelGallery();
}
function modelGallery(){
    return '<section class="card"><h2>分级范文精读</h2>'+modelTexts.map(([genre,level,en,cn,words,pattern,structure])=>'<details><summary>'+esc(genre)+' · Level '+esc(level)+'</summary><p lang="en">'+esc(en)+'</p><p>'+esc(cn)+'</p><p>词汇　'+esc(words)+'</p><p>可借鉴的句型　'+esc(pattern)+'</p><p>结构　'+esc(structure)+'</p></details>').join('')+'</section>';
}
