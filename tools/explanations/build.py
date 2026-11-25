"""Compile teaching notes from bilingual content and the checked question records."""
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
def build(bank):
    def lines(path): return (ROOT/'tools'/path).read_text().splitlines()
    titles = lines('bank3000/read.txt')[::8]
    notes = dict(zip((t.split('|')[1] for t in titles), lines('explanations/article-notes.txt'), strict=True))
    models = [r.split('|') for r in lines('model-texts.txt')]
    scenes = [r.split('|') for r in lines('final2000/scenes.txt') if not r.isdigit()]
    contexts = lines('contexts.txt')
    editor_notes = lines('explanations/editor-reasons.txt')
    foundations = lines('explanations/foundations.txt')
    reading_notes = lines('explanations/reading-reasons.txt')
    assert len(editor_notes)==len(foundations)==100 and len(reading_notes)==50
    grammar_pairs = lines('bank3000/pairs.txt')
    glossary = {}
    for q in bank:
        m=re.search(r'^(.+?) 在这里表示“([^”]+)”',q['why'])
        if m: glossary.setdefault(m[1],m[2])
    result={}
    for q in bank:
        source=q.get('source',''); key=q['slots'][0][0]; kind=q['kind']
        facts=[]
        if q.get('article') in notes: facts.append(notes[q['article']])
        if source.startswith(('model-word:','model-structure:','model-order:')):
            genre,_,en,cn,vocab,frame,analysis=models[int(source.split(':')[1])-1]
            if kind=='阅读理解' and source.startswith('model-word:'):
                term=re.search('“(.+?)”',q['text'].split('\n\n')[-1])[1]
                sentence=next(s for s in re.split(r'(?<=[.!?])\s+',en) if re.search(r'\b'+re.escape(term)+r'\b',s,re.I))
                facts.append('原句定位：'+sentence)
                facts.append(analysis)
            else: facts.append('文体是'+genre+'。结合文中词语读各段的作用：'+vocab+'。')
        if source.startswith('contexts:'):
            marked=contexts[int(source.split(':')[1])-1].split('|')[0]
            verb=re.search(r'\[([^/]+)/([^\]]+)\]',marked)
            noun=re.search(r'\{([^}]+)\}',marked)
            if verb and noun:facts.append('译文要保留动作 '+verb[1]+'（原形 '+verb[2]+'）和具体对象或场景词 '+noun[1]+'。把它们放回原句，再核对时间、数量及修饰成分。')
        if source.startswith('scene-link:'):
            row=scenes[int(source.split(':')[1])-1]
            facts.append('检验续句时，可以再问：'+row[2]+' 答案是 '+row[3]+' '+row[6])
        if source.startswith('scenes:') and kind=='阅读理解':
            row=lines('final2000/scenes.txt')[int(source.split(':')[1])-1].split('|')
            word,meaning=re.search(r'\{([^/]+)/([^}]+)\}',row[0]).groups()
            facts.append('定位词：'+word+'（'+meaning+'）。先定位它指的事物，再核对问题问的是谁、什么时候或发生了什么。')
        if source.startswith('writing-order:'):
            focus,*_=lines('final2000/editor.txt')[int(source.split(':')[1])-1].split('|')
            facts.append('这句话的写作任务是“'+focus+'”。把三个片段连读，核对主句和后面的补充信息是否接得上。')
        number=int(q['id'][2:])
        if source.startswith(('editor:', 'writing-order:')):
            facts.insert(0,editor_notes[int(source.split(':')[1])-1])
        if 261<=number<=360:
            facts.insert(0,foundations[number-261])
        if 717<=number<767 and source.startswith('reading_choices'):
            facts.insert(0,reading_notes[number-717])
        if 1<=number<=200 and number%2==0:
            marked=contexts[number//2-1].split('|')[0]
            form,lemma=re.search(r'\[([^/]+)/([^\]]+)\]',marked).groups()
            assert key==form
            if number<=40:
                subject=marked.split(' [')[0]
                ending='，主语是第三人称单数，需要 '+form+'。若主语换成 they，就用 '+lemma+'。' if form!=lemma else '，用原形 '+lemma+'；只有换成第三人称单数主语时才要考虑加 -s 或 -es。'
                facts.insert(0,'先判断这是日常情况，再问“谁做这个动作”。本句主语是 '+subject+ending)
            elif number<=80:
                facts.insert(0,'按译意，这件事已经发生，横线是肯定句的谓语，前面没有 did 帮它标出过去。因此要把 '+lemma+' 写成过去式 '+form+'。对比否定式 did not '+lemma+'：此时时间信息已经由 did 表达。')
            else:
                aux,part=form.split(' ',1)
                if number<=120:
                    rule='前半段 '+aux+' 对应主语以及动作发生的时间，后半段 '+part+' 表示当时正在做的动作。只写 '+part+' 会让这一分句缺少承担时态的动词。'
                elif number<=160:
                    rule='完成式拆成 '+aux+' + '+part+'。'+('参照点是现在，既要保留“截至现在”的含义，又要让 have 或 has 与主语一致。' if number<=140 else '参照点已经在过去，句中这个动作比那个参照点还早，所以用 had。')
                elif number<=180:
                    rule='will 表明这是尚待发生的动作；时态已经放在 will 上，后面直接接 '+lemma+'，无需再加 -s 或 -ed。'
                else:
                    rule='这里主语承受动作。'+aux+' 负责表示时间并配合主语，'+part+' 是 '+lemma+' 的过去分词；只用主动形式会改变谁对谁做事。'
                facts.insert(0,rule)
        if source.startswith('grammar3000:'):
            marked,cn,*rules=grammar_pairs[int(source.split(':')[1])-1].split('|')
            targets=[p.split('/') for p in re.findall(r'\[([^\]]+)\]',marked)]
            j=(number-2201)%2
            assert targets[j][0]==key
            ok,wrong=targets[j]
            left,right=q['text'].split('____')
            left=' '.join(left.split()[-4:])
            right=' '.join(right.split()[:4])
            bad=' '.join((left,wrong,right)).strip()
            facts.append('试把另一项代入：“'+bad+'”。本题要求“'+cn+'”，这里要满足的是“'+rules[j]+'”，所以用 '+ok+'。再看同句的 '+targets[1-j][0]+'：'+rules[1-j]+'。这两处起的作用要分开判断。')
        opts=[o+'（'+glossary[o]+'）' for o in q['options'] if o!=key and o in glossary]
        if opts and q['cat']=='单词':facts.append('其他选项的词义：'+'、'.join(opts)+'。把各个意思代入中文情境，就能比较它们与目标词的差别。')
        result[q['id']]=facts
    return result
