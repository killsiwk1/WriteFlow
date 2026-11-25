"""Build the final four checked batches on the 1,406-question release."""
import json
import random
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
folder = root / 'tools/final2000'
bankfile = root/'web/bank.json'
previous = json.loads(bankfile.read_text())
bank = previous[:1406]
assert len(bank) == 1406 and bank[-1]['id'] == 'WF1406'
rng = random.Random(2000)
seen = {q['text'] for q in bank}
def append(source,level,cat,kind,text,cn,slots,why,point,hint,options=None,**extra):
    assert text not in seen, (source,text)
    seen.add(text)
    assert level in range(1,6) and all([text,cn,why,point,hint])
    assert slots and all(group and all(a.strip() for a in group) for group in slots)
    opts = list(options or [])
    if opts:
        assert len(opts)==len(set(opts)) and all(group[0] in opts for group in slots)
        rng.shuffle(opts)
        if len(slots)>1 and opts==[g[0] for g in slots]: opts.reverse()
    for pool,group in zip(extra.get('slotOptions',[]),slots):
        assert len(set(pool))==len(pool)==4 and group[0] in pool
    bank.append(dict(id=f'WF{len(bank)+1}',level=level,cat=cat,kind=kind,text=text,cn=cn,slots=slots,why=why,point=point,hint=hint,tip='复核自己的答案，再回到原句找依据。',options=opts,source=source,**extra))

def graded_lines(name):
    for n,line in enumerate((folder/name).read_text().splitlines(),1):
        if line.isdigit():
            level=int(line)
        else:
            yield level,n,line.split('|')

def save_batch(first):
    items=bank[first:]
    assert 95<=len(items)<=200
    (root/'tools/checked-batches'/f'{items[0]["id"]}-{items[-1]["id"]}.json').write_text(json.dumps(items,ensure_ascii=False,indent=1))

scenes=[]
for level,n,(marked,cn,question,key,d1,d2,reason) in graded_lines('scenes.txt'):
    grammar,=re.findall(r'\[([^\]]+)\]',marked)
    vocab,=re.findall(r'\{([^}]+)\}',marked)
    form,lemma,rule=grammar.split('/')
    word,gloss=vocab.split('/')
    passage=marked.replace('['+grammar+']',form).replace('{'+vocab+'}',word)
    where=f'scenes:{n}'
    verb_gap=marked.replace('['+grammar+']','____').replace('{'+vocab+'}',word)
    variants={'smelled':['smelt'],'to spend':[],'walking':['to walk'] if 'prefer' in passage else [],'opens':[]}
    append(where,level,'动词与句法','动词变形',verb_gap,cn,[[form,*variants.get(form,[])]],rule+'。完整表达：'+passage,'语境中的动词形式','用 '+lemma+' 的适当形式补全。可填多个词。')
    scenes.append((where,level,marked,grammar,form,vocab,word,gloss,cn,passage,question,key,d1,d2,reason))
save_batch(1406)
for where,level,marked,grammar,form,vocab,word,gloss,cn,passage,question,key,d1,d2,reason in scenes:
    gap=marked.replace('['+grammar+']',form).replace('{'+vocab+'}','____')
    opts=[word]+rng.sample(sorted({s[6] for s in scenes if s[6]!=word and s[7]!=gloss}),3)
    append(where,level,'单词','语境选词',gap,cn,[[word]],f'“{gloss}”在这里对应 {word}。结合前后句可还原为：'+passage,'词义与语境','根据句意与中文选择用词。',opts)
save_batch(1506)
for where,level,marked,grammar,form,vocab,word,gloss,cn,passage,question,key,d1,d2,reason in scenes:
    append(where,level,'阅读理解与语境判断','阅读理解',passage+'\n\n'+question,cn,[[key]],reason,'阅读证据与判断','在文中找到支持选项的依据。',[key,d1,d2])
edit_lines=(folder/'editor.txt').read_text().splitlines()
topics=(root/'tools/writing-topics.txt').read_text().splitlines()
assert len(edit_lines)==len(topics)==100
for i,(editor,topic) in enumerate(zip(edit_lines,topics),1):
    focus,good,poor,irrelevant=editor.split('|')
    title,cn,genre,task,words=topic.split('|')
    level=4 if genre in ['现象分析','利弊分析','问题与解决办法','观点表达','故事续写'] else 3 if genre in ['申请信','演讲稿','事件描述','事物比较','建议信','求助信'] else 2
    append(f'editor:{i}',level,'写作表达','表达选择',cn+'｜'+genre+'\n'+task+'。哪一句最能完成这一步：'+focus+'？',cn,[[good]],'这一步需要'+focus+'。所选句用具体内容回应了题目要求：'+good,focus,'比较候选句是否回应指定的读者、情境和写作目的。',[good,poor,irrelevant])
save_batch(1606)
for level,n,(chunks,cn,why) in graded_lines('sequence.txt'):
    parts=chunks.split(' / ')
    append(f'sequence:{n}',level,'句子结构','句子排序','按中文意思还原完整句子：'+cn,cn,[[s] for s in parts],why+'。原句：'+' '.join(parts),'语序与句法','按顺序为每个位置选一个词块，每块用一次。',parts)
lines=(folder/'articles.txt').read_text().splitlines()
assert len(lines)==20*8
for i in range(0,len(lines),8):
    header,marked,cn,notes,*questions=lines[i:i+8]
    level,title=header.split('|');level=int(level)
    full=re.sub(r'\[([^\]]+)\]',r'\1',marked)
    keys=re.findall(r'\[([^\]]+)\]',marked)
    fields=notes.split('|')
    pools=[opts.split('/') for opts in fields[::2]]
    assert [p[0] for p in pools]==keys and len(keys)==3
    for pool in pools:rng.shuffle(pool)
    append(f'articles:{i+1}',level,'短文完形','短文完形',re.sub(r'\[[^\]]+\]','____',marked),cn,[[k] for k in keys],' '.join(f'第{idx}空（{key}）：{note}' for idx,(key,note) in enumerate(zip(keys,fields[1::2]),1)),'篇章完形：词义、语法与逻辑','每个空格各选四个选项中的一项。',slotOptions=pools,article=title)
    for line in questions:
        question,answers,reason=line.split('|')
        choices=answers.split('/')
        assert len(choices)==4
        append(f'articles:{i+1}',level,'阅读理解与语境判断','阅读理解',full+'\n\n'+question,cn,[[choices[0]]],reason,'细读与推断','阅读整篇短文，选择有原文依据的回答。',choices,article=title)
save_batch(1806)
assert len(bank)==2000 and len(set(q['id'] for q in bank))==2000
assert bank[:1406]==previous[:1406]
bankfile.write_text(json.dumps(bank,ensure_ascii=False,indent=1))
print('2000 questions; 594 new; existing 1406 unchanged')
