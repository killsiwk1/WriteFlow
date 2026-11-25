"""Extend the 2000-question release with deterministic, checked batches."""
import json
import random
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tools = root / 'tools'
bankfile = root / 'web/bank.json'
bank = json.loads(bankfile.read_text())[:2000]
assert len(bank) == 2000 and bank[-1]['id'] == 'WF2000'
seen = {item['text'] for item in bank}
rng = random.Random(3000)


def lines(name):
    return (tools / name).read_text().splitlines()


def add(cat, kind, level, text, cn, why, point, hint, keys, choices, source, **extra):
    assert text not in seen and all((cn, why, point, hint, source)), text
    seen.add(text)
    assert 1 <= level <= 5 and all(key.strip() for key in keys)
    if choices:
        assert len(set(choices)) == len(choices) and set(keys) <= set(choices)
        choices = choices.copy()
        rng.shuffle(choices)
        if len(keys) > 1 and keys == choices:
            choices.reverse()
    bank.append(dict(id=f'WF{len(bank)+1}', cat=cat, kind=kind, level=level, text=text,
                     cn=cn, why=why, point=point, hint=hint, slots=[[key] for key in keys],
                     options=choices, source=source, tip='核对上下文，再读一遍完整表达。', **extra))
    if len(bank) % 100 == 0:
        batch = bank[-100:]
        name = batch[0]['id'] + '-' + batch[-1]['id'] + '.json'
        (tools / 'checked-batches' / name).write_text(json.dumps(batch, ensure_ascii=False, indent=1))


articles = lines('bank3000/read.txt')
for i in range(0, len(articles), 8):
    header, passage, cn, notes, *questions = articles[i:i+8]
    level, title = header.split('|')
    src = 'read3000:' + title
    masks = []
    fields = notes.split('|')
    for field, reason in zip(fields[::2], fields[1::2]):
        pool = field.split(':')
        key = pool[0]
        assert len(set(pool)) == 4
        hit = re.search(r'\b' + re.escape(key) + r'\b', passage)
        assert hit, (title, key)
        rng.shuffle(pool)
        masks.append((hit.start(), hit.end(), key, pool, reason))
    masks.sort()
    assert masks[0][1] <= masks[1][0]
    masked = passage
    for start, end, *_ in reversed(masks):
        masked = masked[:start] + '____' + masked[end:]
    add('短文完形', '短文完形', int(level), masked, cn,
        ' '.join(f'第{j}空 {m[2]}：{m[4]}' for j,m in enumerate(masks,1)),
        '上下文选词', '结合全文为每一空选词。', [m[2] for m in masks], [], src,
        article=title, slotOptions=[m[3] for m in masks])
    for row in questions:
        question, answers, reason = row.split('|')
        opts = answers.split('/')
        add('阅读理解与语境判断', '阅读理解', int(level), passage+'\n\n'+question, cn, reason,
            '阅读证据与推断', '根据文章选择有依据的答案。', opts[:1], opts, src, article=title)

for i, row in enumerate(lines('bank3000/pairs.txt')):
    if row.isdigit():
        level = int(row)
        continue
    marked, cn, *reasons = row.split('|')
    pattern = r'\[([^\]]+)\]'
    pairs = [pair.split('/') for pair in re.findall(pattern,marked)]
    assert len(pairs) == len(reasons) == 2
    for j, (key, wrong) in enumerate(pairs):
        replacements = iter('____' if k == j else p[0] for k,p in enumerate(pairs))
        text = re.sub(pattern, lambda m: next(replacements), marked)
        category = '动词与句法'
        for rule, category_name in [
            ('冠词|元音音素|the shorter','冠词'),
            ('主格|宾格|所属|物主|hers|whose 表','代词'),
            ('主语|单数|复数|可数|基数|数量|就近','名词量词与主谓一致'),
            ('完成时|过去时|过去式|一般现在时|进行时|过去的过去','时态'),
            ('后动名词|被动|情态|非谓语|分词|不定式','情态被动与非谓语'),
            ('从句|连接|引导|引出|让步|并列','从句与连接词'),
            ('介词|表位置|表下方|on the form|on display|at noon','介词'),
        ]:
            if re.search(rule, reasons[j]):
                category = category_name
                break
        add(category, '单项选择', level, text, cn, reasons[j]+'。完整句：'+
            re.sub(pattern, lambda m:m[1].split('/')[0], marked), reasons[j],
            '选择符合句意和语法的表达。', [key], [key,wrong], f'grammar3000:{i+1}')

scenes = []
for row in lines('final2000/scenes.txt'):
    if row.isdigit():
        level = int(row)
        continue
    marked, cn, *_ = row.split('|')
    full = re.sub(r'[\[{]([^/]+)/[^\]}]+[\]}]', r'\1', marked)
    opening, ending = re.split(r'(?<=[.!?]) ', full, maxsplit=1)
    scenes.append((level,opening,ending,cn))
for i,(level,opening,ending,cn) in enumerate(scenes):
    # Chinese context fixes the intended meaning even where another ending might be grammatical.
    others = [e for lv,_,e,_ in scenes if lv == level and e != ending]
    add('阅读理解与语境判断','阅读理解',level,opening+'\n\n根据以下中文情境，选出衔接原文的后续内容。\n'+cn,cn,
        '前句建立情境，后文补充的信息是：'+ending,'上下文衔接与双语理解','核对人物、动作及事件的先后关系。',
        [ending],[ending,*rng.sample(others,2)],f'scene-link:{i+1}')

models = [l.split('|') for l in lines('model-texts.txt')]
for i,(genre, level, passage, cn, vocab, frame, analysis) in enumerate(models):
    other = [m[-1] for m in models if m[0] == genre and m[-1] != analysis]
    add('阅读理解与语境判断','阅读理解',int(level),passage+'\n\n哪项分析准确描述了作者组织这篇文章的方法？',
        cn,analysis,'文章结构与写作意图','对照各选项提到的细节及其出现顺序。',[analysis],[analysis,*other],f'model-structure:{i+1}')
    for term in vocab.split('；'):
        word, gloss = term.strip().rsplit(' ',1)
        match = re.search(r'\b'+re.escape(word)+r'(?:s|ed|ing)?\b',passage,re.I)
        if match:
            break
    assert match, (i, vocab)
    distractors = sorted({v.strip().rsplit(' ',1)[1] for m in models for v in m[4].split('；')
                          if v.strip().rsplit(' ',1)[1] != gloss})
    add('阅读理解与语境判断','阅读理解',int(level),passage+'\n\n文中的 “'+match[0]+'” 在此处最接近哪个意思？',
        cn,'联系上下文，“'+match[0]+'” 表示“'+gloss+'”。','语境词义','根据词语所在句子的意思判断。',
        [gloss],[gloss,*rng.sample(distractors,2)],f'model-word:{i+1}')

for i,(genre,level,passage,cn,_,_,analysis) in enumerate(models[:56]):
    sentences = re.split(r'(?<=[.!?])\s+',passage)
    assert len(sentences)>=3
    cuts=[0,max(1,len(sentences)//3),max(2,2*len(sentences)//3),len(sentences)]
    parts=[' '.join(sentences[a:b]) for a,b in zip(cuts,cuts[1:])]
    add('句子结构','段落排序',int(level),'依照中文梗概，还原这篇'+genre+'的行文顺序。\n'+cn,cn,analysis,
        '篇章顺序与照应','从三个片段中依次选择开头、中段与结尾。',parts,parts,f'model-order:{i+1}')

for i,(row,topic) in enumerate(zip(lines('final2000/editor.txt'),lines('writing-topics.txt'))):
    focus,good,*_ = row.split('|')
    title,cn,genre,task,_ = topic.split('|')
    words=good.split()
    cuts=[0,len(words)//3,2*len(words)//3,len(words)]
    parts=[' '.join(words[a:b]) for a,b in zip(cuts,cuts[1:])]
    add('句子结构','句子排序',3 if genre in ('现象分析','利弊分析','问题与解决办法','观点表达','故事续写') else 2,
        cn+'｜'+focus+'\n写作情境：'+task+'。请还原参考句。',cn,'参考句：'+good,'写作句子的语序',
        '用给定的三个片段，组成完整的英语句子。',parts,parts,f'writing-order:{i+1}')
assert len(bank)==3000 and len({q['id'] for q in bank})==3000
bankfile.write_text(json.dumps(bank,ensure_ascii=False,indent=1))
