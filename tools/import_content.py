"""Import the individually authored exercises from the previous editing session."""
import json
import random
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / "tools/bank21"
bank = json.loads((src / "base500.json").read_text())
rng = random.Random(21)
seen = {q["text"].strip().casefold() for q in bank}
batches = root / "tools/checked-batches"
batches.mkdir(exist_ok=True)
for file in sorted(src.iterdir()):
    if file.suffix not in {".txt", ".tsv"}:
        continue
    lines = file.read_text().splitlines()
    for ix, line in enumerate(lines):
        if line.startswith("#"):
            header = line[1:].strip()
            continue
        if not line.strip():
            continue
        parts = line.split("|")
        opts, extra, hint = [], {}, ""
        level = int(header[-1]) if header.startswith("level") else min(5, 1 + ix*5//len(lines))
        if file.name.startswith("clauses"):
            text, cn, key, choices, point, why, tip = parts
            cat, level = header, int(file.stem[-1])
            if choices.startswith(("@","=","!")):
                hint = choices[1:]
            else:
                opts = [key, *choices.split(" / ")]
            slots = [[key]]
            kind = "单项选择" if opts else "句子填空"
            if choices.startswith("+"):
                slots = [[s] for s in key.split(" & ")]
                opts = [s[0] for s in slots] + choices[1:].split(" / ")
                kind = "多项选择"
        elif file.stem == "reading_choices":
            text, cn, key, d1, d2, why, tip = parts
            opts, slots = [key,d1,d2], [[key]]
            cat,kind,point = "阅读理解与语境判断","阅读理解","根据原文判断"
        elif file.stem.startswith("reading"):
            text,cn,a,b,c = parts
            slots = [[s] for s in re.findall(r'\[([^\]]+)\]', text)]
            text = re.sub(r'\[[^\]]+\]', '____', text)
            if file.stem.endswith("cloze"):
                point, why, tip = a,b,"结合全文选择并核对每一空。"
                pool = list(dict.fromkeys([s[0] for s in slots]+[c]))
                rng.shuffle(pool)
                extra["wordBank"] = pool
                cat,kind = "短文完形","短文完形"
            else:
                point,why,tip = "短语在语境中的含义",c,"读完整句再选短语。"
                cat,kind = "固定搭配与短语动词","语境选词"
                opts = [slots[0][0],a,b]
        else:
            tag,*p = parts
            cat = "句子结构"
            if tag == "N":
                text,key,ds,cn,point,why,tip = p
                opts,slots = [key,*ds.split(";")],[[key]]
                kind,cat = "单项选择","名词量词与主谓一致"
            elif tag == "E":
                text,bad,key,cn,point,why,tip = p
                hint,slots,kind = "将 "+bad+" 改为正确形式。",[[key]],"句子改错"
                cat = "纠错与句型转换"
            elif tag in ("T","X"):
                if tag == "X":
                    text,hint,key,cn,point,why,tip = p
                    kind,cat = "句型转换","纠错与句型转换"
                else:
                    hint,cn,key,point,why,tip = p
                    text,kind = cn,"中译英"
                slots = [key.split("/")]
            elif tag == "O":
                chunks,cn,point,why,tip = p
                text,kind = "排列词块："+cn,"句子排序"
                opts = chunks.split(" / ")
                slots = [[s] for s in opts]
            elif tag == "M":
                text,left,right,cn,point,why,tip = p
                extra["pairsLeft"] = left.split("§")
                opts = right.split("§")
                slots = [[s] for s in opts]
                kind = "句子配对"
            else:
                text,key,cn,point,why,tip = p
                slots,kind = [[key]],"句子填空"
        if not opts:
            slots=[[answer.strip() for value in group for answer in value.split("/")] for group in slots]
        signature = (text+str(extra.get("pairsLeft",""))).strip().casefold()
        if signature in seen:
            continue
        seen.add(signature)
        rng.shuffle(opts)
        n = len(bank)+1
        assert slots and all(all(s.strip() for s in group) for group in slots)
        assert all([text,cn,why,point,tip]) and 1 <= level <= 5
        bank.append(dict(id=f"WF{n:03}",cat=cat,level=level,text=text,slots=slots,cn=cn,point=point,why=why,tip=tip,kind=kind,options=opts,hint=hint,source=f"{file.name}:{ix+1}",**extra))
        if (n-500)%150 == 0:
            (batches/f"{n}.json").write_text(json.dumps(bank[-150:],ensure_ascii=False))
rem=(len(bank)-500)%150
if rem:
    (batches/f"{len(bank)}.json").write_text(json.dumps(bank[-rem:],ensure_ascii=False))
(root/"web/bank.json").write_text(json.dumps(bank,ensure_ascii=False,indent=1))
print(len(bank))
