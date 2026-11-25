const independentStart = prompts.guided.length;
const demandingGenres = ['现象分析','利弊分析','问题与解决办法','观点表达','故事续写'];
const middleGenres = ['申请信','演讲稿','事件描述','事物比较','建议信','求助信'];
const topicMeta = writingTopics.map(([title,cn,genre,task,keywords],ix)=>{
    const level = demandingGenres.includes(genre)?4+Number(ix%3===0):middleGenres.includes(genre)?3:1+Number(ix%3!==0);
    const [,,,example] = genreLessons.find(row=>row[0]===genre);
    const structure = genreLessons.find(row=>row[0]===genre)[2];
    prompts.guided.push([genre+' · '+cn,title+' / '+cn,task+'。建议 '+(40+level*15)+'–'+(65+level*15)+' 词。关键词：'+keywords+'。',example,structure]);
    return {title:cn,genre,level,index:independentStart+ix};
});
let topicFilters={genre:'全部',level:'全部',title:'全部'};
function matchingTopics(){
    return topicMeta.filter(t=>Object.keys(topicFilters).every(k=>topicFilters[k]==='全部'||String(t[k])===topicFilters[k]));
}
function topicTools(){
    const fields=[['文体','genre'],['难度','level'],['独立主题','title']];
    return '<section class="card row">'+fields.map(([label,key])=>select(label,'topic-'+key,['全部',...new Set(topicMeta.map(t=>String(t[key])))],topicFilters[key])).join('')+action('随机独立作文题','randomTopic')+'</section>';
}
function chooseTopic(random){
    const items=matchingTopics();
    if(!items.length){toast('没有同时符合这些条件的题目，请调整筛选。');return}
    promptIx.guided=items[random?Math.floor(Math.random()*items.length):0].index;
    render();
}
