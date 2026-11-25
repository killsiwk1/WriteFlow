"""Append bilingual reading units and a translation practice set to the frozen preview."""
from pathlib import Path
import json
import random
import re

root = Path(__file__).resolve().parents[1]
tools = root/'tools'
bank_path = root/'web/bank.json'
bank = json.loads(bank_path.read_text())[:1176]
assert len(bank) == 1176 and bank[-1]['id'] == 'WF1176'
rng = random.Random(211)
def append(**item):
    item['id'] = f'WF{len(bank)+1}'
    assert all(item[k] for k in ('point','why','slots','text','cn','source'))
    bank.append(item)

lines = (tools/'article-units.txt').read_text().splitlines()
assert len(lines)%6 == 0
for offset in range(0,len(lines),6):
    header,marked,cn,notes,*questions = lines[offset:offset+6]
    level,title = header.split('|')
    passage = marked.replace('[','').replace(']','')
    shared = dict(level=int(level),cn=cn,article=title,source=f'article-units:{offset+1}',tip='提交后对照译文，回到原文定位依据。')
    choices,why1,choices2,why2 = notes.split('|')
    pools = [choices.split('/'),choices2.split('/')]
    keys = re.findall(r'\[([^\]]+)\]',marked)
    assert keys == [p[0] for p in pools] and all(len(set(p))==4 for p in pools)
    for p in pools: rng.shuffle(p)
    append(**shared,cat='短文完形',kind='短文完形',text=re.sub(r'\[[^\]]+\]','____',marked),slots=[[a] for a in keys],options=[],slotOptions=pools,why='第 1 空：'+why1+' 第 2 空：'+why2,hint='每空从四个选项中选一个。',point='篇章语境与语法')
    for line in questions:
        question,choices,why = line.split('|')
        options = choices.split('/')
        assert len(set(options))==4
        answer = options[0]
        rng.shuffle(options)
        append(**shared,cat='阅读理解与语境判断',kind='阅读理解',text=passage+'\n\n'+question,slots=[[answer]],options=options,why=why,hint='根据原文选择。',point='阅读证据与推断')
for ix,line in enumerate((tools/'contexts.txt').read_text().splitlines()):
    en,cn=line.split('|')
    en=re.sub(r'\[([^/]+)/[^\]]+\]',r'\1',en)
    en=re.sub(r'\{([^}]+)\}',r'\1',en)
    assert not re.search(r'[{}\[\]]',en)
    to_en=ix%2==0
    target=en if to_en else cn
    append(level=ix//20+1,cat='双向翻译',kind='中译英' if to_en else '英译中',text=cn if to_en else en,cn=cn,slots=[[target]],options=[],point='整句翻译与语义核对',why=en+' 对应“'+cn+'”。核对动作、主语和时间信息，再比较自然表达。',hint='翻译整句。提交后可对意义相同的其他译法进行自评。',tip='注意语序和修饰语的范围。',source=f'contexts:{ix+1}')
assert len({q['id'] for q in bank})==len(bank)
for chunk in range(1176,len(bank),150):
    batch=bank[chunk:chunk+150]
    (tools/'checked-batches'/f'{batch[-1]["id"]}.json').write_text(json.dumps(batch,ensure_ascii=False,indent=1))
bank_path.write_text(json.dumps(bank,ensure_ascii=False,indent=1))
print(len(bank))
for ix,line in enumerate((tools/'preposition-drills.txt').read_text().splitlines()):
    if line.isdigit():
        level=int(line)
        continue
    marked,cn,other,rule=line.split('|')
    key,=re.findall(r'\[([^\]]+)\]',marked)
    slots=[[key]+(other.split(',') if other else [])]
    append(level=level,cat='介词',kind='句子填空',text=marked.replace('['+key+']','____'),cn=cn,slots=slots,options=[],point=rule,why=f'{rule}。原句为 '+marked.replace('[','').replace(']',''),hint='根据中文补全英文，每空一词。',tip='先辨认所表达的关系，再看前后搭配。',source=f'preposition-drills:{ix+1}')
assert len(bank)==1406
(tools/'checked-batches/WF1406.json').write_text(json.dumps(bank[-100:],ensure_ascii=False,indent=1))
bank_path.write_text(json.dumps(bank,ensure_ascii=False,indent=1))
