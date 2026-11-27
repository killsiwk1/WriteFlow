"""Compile offline course entries and their stable, separately namespaced exercises."""
import re
from pathlib import Path
ROOT=Path(__file__).parent

def rows(name):
    return [line.split('|') for line in (ROOT/(name+'.txt')).read_text().splitlines() if line.strip()]

def build(bank):
    lessons=[]; questions=[]
    def lesson(group,section,name,en,**extra):
        slug=re.sub('[^a-z0-9]+','-',en.lower()).strip('-')
        item=dict(id=group+'-'+slug,group=group,section=section,name=name,en=en,ids=[],**extra)
        lessons.append(item)
        return item
    def ask(l,code,text,answer,cn,why,opts=(),hint='根据句意作答'):
        qid='K-'+l['id']+'-'+code
        questions.append(dict(id=qid,knowledge=l['id'],kind='选择' if opts else '输入',cat=l['section'],text=text,slots=[[answer]],options=list(opts),cn=cn,why=why,point=l['name'],level=2,hint=hint,tip=l['en']))
        l['ids'].append(qid)
    def blank(sentence):
        answer=re.search(r'\[([^\]]+)\]',sentence)[1]
        return sentence.replace('['+answer+']','____'),answer
    def choice(a,b):
        return sorted({a,b},key=str.casefold)
    wrong='rices|glove|your|the others|an|softness|on|because of|leave|find|am|wash|mixing|lose|leave|looked|bake|Am|are|posting|waited|bluely|whom|does|clear|than|cheapest|have|do|How|were|few|every|that|That|for|yesterday|openly|fix|did live'.split('|')
    grammar=rows('grammar');assert len(wrong)==len(grammar)
    byid={q['id']:q for q in bank}
    pairs=list(zip(grammar,wrong))
    for *fields,distractor,refs in rows('more-grammar'):
        pairs.append((fields+[refs],distractor))
    for (sec,name,en,scene,example,cn,rule,error,refs),distractor in pairs:
        l=lesson('grammar',sec,name,en,scene=scene,example=example,cn=cn,rule=rule,error=error)
        text,a=blank(example)
        ask(l,'apply',('找出句中的宾语：Mina opened the gate.' if en=='Subject verb and object' else text),a,cn,rule+' '+error,choice(a,('Mina' if en=='Subject verb and object' else distractor)))
        ids=['WF'+n for n in refs.split()] if refs.split()[0].isdigit() else [q['id'] for q in bank if q['point']==refs][:7]
        assert len(ids)>=4 and all(i in byid for i in ids),refs
        l['ids']+=ids
    grammar_index={l['en']:l for l in lessons}
    for en,*pieces in rows('analysis'):
        grammar_index[en]['analysis']=[piece.split('=',1) for piece in pieces]
    authored={}
    for en,text,answer,cn,why in rows('grammar-practice'):
        l=grammar_index[en]
        authored[en]=authored.get(en,0)+1
        ask(l,'practice'+str(authored[en]),text,answer,cn,why)
    for en,n in authored.items():
        l=grammar_index[en]
        ordered=sorted(l['ids'],key=lambda q:not q.startswith('K-'))
        l['ids']=ordered[:max(5,min(10,len(ordered)))] if n<4 else ordered[:n+1]
    morph_notes=dict(rows('morph-notes'))
    morph=rows('morph')
    for i,(form,meaning,parts,pos,gloss,example,cn,transfer) in enumerate(morph):
        typ='前缀' if form.endswith('-') else '后缀' if form.startswith('-') else '词根'
        word=parts.replace('+','')
        if form in ('ex-','anti-'):word=parts.replace('+','-')
        f=form.strip('-');other=morph[(i+3)%len(morph)]
        rule=f'{parts.replace("+"," + ")} → {word}（{pos} {gloss}）。这里的 {form} 提供“{meaning}”这条线索。'
        l=lesson('morph',typ,form,form.strip('-'),scene=cn,example=example,cn=cn,rule=rule,error='对照同族词：'+transfer+'。拆分用来提出猜测，最后回到整句话验证。',keywords=word+' '+transfer)
        if form in morph_notes:
            l['rule']+=' '+morph_notes[form]
        # tele as a combining form is covered once; slash-separated root variants share a lesson.
        ask(l,'meaning',f'在 {word} 中，{form} 提供哪条意思线索？',meaning,cn,rule+' 对比：'+other[0]+' 表示“'+other[1]+'”。',choice(meaning,other[1]))
        context,n=re.subn(r'\b'+re.escape(word)+r'\b','____',example,flags=re.I)
        assert n==1,example
        ask(l,'context',context+'\n用本课构词成分写出表示“'+gloss+'”的单词。',word,cn,l['rule'],hint='先读句子，再检查词义和词性。')
        if pos in ('n.','v.','adj.','adv.'):
            posname={'n.':'名词','v.':'动词','adj.':'形容词','adv.':'副词'}
            ask(l,'pos',example+'\n'+word+' 在句中是什么词性？',posname[pos],cn,rule,tuple(posname.values()))
        if typ=='前缀' or typ=='后缀':
            term=form.strip('-')
            ask(l,'build',f'请从 {word} 中写出表示“{meaning}”的{typ}（只写字母）。',term,word+'：'+gloss,l['rule'])
        else:
            ask(l,'build',f'根据“{meaning}”这条词根线索，辨认正确拆分：{word}',parts,word+'：'+gloss,l['rule'],choice(parts,word[:1]+'+'+word[1:]) if parts!=word[:1]+'+'+word[1:] else choice(parts,word[:-1]+'+'+word[-1:]))
        t,tgloss=transfer.split(' ',1)
        ask(l,'transfer','试用同族词线索：'+t+' 最可能是什么意思？',tgloss,t+'：'+tgloss,rule+f' 把同一线索用于 {t}，可以得到“{tgloss}”。',choice(tgloss,next(morph[(i+j)%len(morph)][4] for j in range(3,len(morph)) if morph[(i+j)%len(morph)][4]!=tgloss)))
    for sec,name,en,scene,example,cn,rule,cue in rows('forms'):
        l=lesson('forms',sec,name,en,scene=scene,example=example,cn=cn,rule=rule,error='判断顺序：先看数量、时间或被修饰的词，再根据上面的词形对照检查拼写。')
        text,a=blank(example);ask(l,'context',text+'（'+cue+'）',a,cn,rule)
    form_lessons={l['en']:l for l in lessons if l['group']=='forms'}
    for en,text,answer,cn,why in rows('form-practice'):
        l=form_lessons[en]
        ask(l,'task'+str(len(l['ids'])),text,answer,cn,why)
    translations=rows('verb-translations')
    verbs=rows('verbs');assert len(translations)==len(verbs)
    for (forms,meaning,tail),(cn,perfect_cn) in zip(verbs,translations):
        base,past,part=forms.split()
        family='三形相同' if base==past==part else '后两形相同' if past==part else '首尾相同' if base==part else '三形不同'
        example=f'Yesterday he [{past}] {tail}.'
        perfect=f'He has already {part} {tail}.'
        rule=f'{base}（{meaning}）→ {past}（过去式）→ {part}（过去分词）。yesterday 定位过去的动作；has 已经承担时态，后面用过去分词。'
        l=lesson('forms','不规则动词 · '+family,base,base,scene='昨天的活动汇报和今天的完成清单，记录的是同一件事。看看动词位置有什么变化。',example=example,cn=cn,rule=rule,error=perfect+'　'+perfect_cn,keywords=forms,forms=forms.split(),meaning=meaning)
        ask(l,'past',blank(example)[0]+' ('+base+')',past,cn,rule)
        ask(l,'part',f'He has already ____ {tail}. ({base})',part,perfect_cn,rule)
    assert len(set(q['text'] for q in questions))==len(questions), '重复题干'
    for q in questions:
        assert not q['options'] or (len(set(q['options']))==len(q['options'])>=2 and q['slots'][0][0] in q['options']),q['id']
    assert len({l['id'] for l in lessons})==len(lessons)
    assert len({q['id'] for q in questions})==len(questions)
    return dict(lessons=lessons,questions=questions)
