"""Build the offline item bank from the editable bilingual source entries."""
from pathlib import Path
import re, json, random
from collections import Counter
here=Path(__file__).resolve().parent
rand=random.Random(59)
bank=[]
def add(cat,lvl,body,slots,cn,point,why,tip,kind,options=None,hint=''):
    bank.append(dict(id=f'WF{len(bank)+1:03}',cat=cat,level=lvl,text=body,slots=slots,cn=cn,point=point,why=why,tip=tip,kind=kind,options=options or [],hint=hint))
def choose(a,others):
    pool=list(dict.fromkeys(x for x in others if x.lower()!=a.lower()))
    choices=[a]+rand.sample(pool,min(3,len(pool)));rand.shuffle(choices);return choices
lines=(here/'contexts.txt').read_text().splitlines()
glosses='车票 地图 篮子 头盔 门 笔记本 报纸 圆 博物馆 楼梯 分钟 制服 盐 图书馆 毯子 舞蹈 街道 沙发 菜单 兔子 树枝 围巾 硬币 包裹 密码 工厂 窗帘 响声 大门 比赛 小桥 戒指 火车 屋顶 账单 小提琴 手套 帐篷 体温 边境 枕头 铃 栅栏 座位 种子 链条 横幅 留言 地址 鸟巢 纪录片 肖像 柠檬 梯子 麦克风 小狗 海报 窗户 成套动作 塔 签名 日记 辩论 邻居 调查 徽章 谜题 渡轮 相机 一条面包 甜点 柜台 路线 路面 面包店 储物柜 练习单 收据 发动机 相册 指南针 获胜者 出发 行李箱 一期刊物 车流量 栖息地 讲座 策略 照明 门阶 黏土 院子 邮政编码 委员会 走廊 管道工 回收利用 失主 损坏'.split()
assert len(glosses)==len(lines)
words=[re.search(r'{(.*?)}',x)[1] for x in lines]
for i,line in enumerate(lines):
    en,cn=line.split('|');word=words[i];v,base=re.search(r'\[(.*?)/(.*?)\]',en).groups()
    sentence=re.sub(r'\[.*?\]',v,en)
    lvl=i//20+1
    letters=list(word);rand.shuffle(letters)
    if ''.join(letters)==word: letters=letters[1:]+letters[:1]
    mode='选择' if i%2==0 else '输入'
    add('单词',lvl,sentence.replace('{'+word+'}','____'),[[word]],cn,'语境选词与拼写',f'{word} 在这里表示“{glosses[i]}”。完整句子是 {sentence.replace("{","").replace("}","")}',f'留意词形与拼写，目标词共 {len(word)} 个字母。',mode,choose(word,words) if mode=='选择' else [],'按译文选词' if mode=='选择' else '按译文重排字母：'+' · '.join(letters))
    prompt=re.sub(r'\[.*?\]','____',en).replace('{','').replace('}','')
    t=('一般现在时' if i<20 else '一般过去时' if i<40 else '现在进行时' if i<50 else '过去进行时' if i<60 else '现在完成时' if i<70 else '过去完成时' if i<80 else 'will 一般将来时' if i<90 else ('一般现在时被动语态' if v.startswith(('is ','are ')) else '一般过去时被动语态'))
    rules={'一般现在时':'习惯性动作要核对主语人称和单复数','一般过去时':'事情发生在过去，使用动词过去式','现在进行时':'当下进行的动作，用 am/is/are + -ing','过去进行时':'过去某一时刻正在进行，用 was/were + -ing','现在完成时':'用 have/has 加过去分词，注意主语','过去完成时':'在过去的参照事件之前已经发生，用 had 加过去分词','will 一般将来时':'will 后接动词原形','一般现在时被动语态':'主语承受动作，用 is/are 加过去分词','一般过去时被动语态':'过去的被动动作用 was/were 加过去分词'}
    choices=choose(v,[base, 'will '+base,'to '+base,'must '+base]) if i%4==0 else []
    add('时态',lvl,prompt,[[v]],cn,t,rules[t]+f'，这里应填 {v}。','先找时间线索，再检查助动词和动词形式。','选择' if choices else '词形',choices,f'用 {base} 的{t}形式')
sizes={'代词':60,'介词':60,'冠词':40,'词形变化':50,'句子结构':50}
for file in ['grammar.txt','forms.txt']:
    for line in (here/file).read_text().splitlines():
        if line.startswith('#'): cat=line[1:];i=0;continue
        en,cn,point=line.split('|');token=re.search(r'\[(.*?)\]',en)[1].split('/')
        if cat=='词形变化':
            base=token.pop();hint='根据译文，用 '+base+' 的适当形式填空';kind='词形'
            if token[0]=='ending':token.append('end')
            if token[0]=='historical':token.append('historic')
        else: hint='根据中文补全指定表达';kind='输入'
        opts=[]
        if cat=='冠词':
            opts=['a','an','the','Ø'];kind='选择';hint='选择冠词，Ø 表示不填'
        elif cat in ('代词','介词','句子结构'):
            # Closed choices isolate the intended construction from other grammatical paraphrases.
            vocab={'代词':['myself','hers','ourselves','its','whom'],'介词':['onto','during','beside','within','toward'],'句子结构':['whose','being','nor','has','theirs']}[cat]
            opts=choose(token[0], [x for x in vocab if x.lower() not in [y.lower() for y in token]])
            kind='选择';hint='按中文意思选择'
        add(cat,i//(sizes[cat]//5)+1,en.replace('['+'/'.join(re.search(r'\[(.*?)\]',en)[1].split('/'))+']','____'),[token],cn,point,f'{point}。这句话应选用「{" / ".join(token)}」。','核对空格前后的搭配与译文中的指代或语义。',kind,opts,hint);i+=1
for i,line in enumerate((here/'passages.txt').read_text().splitlines()):
    en,cn,why=line.split('|');slots=[s.split('/') for s in re.findall(r'\[(.*?)\]',en)]
    add('短文完形',i//8+1,re.sub(r'\[.*?\]','____',en),slots,cn,'上下文综合运用',why,'两个空分别核对，注意前后句的时间与指代。','短文',hint='根据译文，从词组中选词并依次填入两空：'+' / '.join(sorted(set([x[0] for x in slots]+['were' if 'were' not in str(slots) else 'will']),key=str.lower)))
assert Counter(x['cat'] for x in bank)==dict(单词=100,时态=100,短文完形=40,**sizes)
assert len({q['text'] for q in bank})==len(bank)
for q in bank:
    assert q['text'].count('____')==len(q['slots']) and q['level'] in range(1,6),q
(here.parent/'web/bank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=1),encoding='utf-8')
print(len(bank),'items validated')
