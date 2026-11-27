from pathlib import Path
import json, base64
from knowledge.build import build as knowledge_content
from explanations.build import build as explanation_notes
root=Path(__file__).resolve().parents[1]
out=root/'dist'
out.mkdir(exist_ok=True)
def source(name): return (root/'web'/name).read_text(encoding='utf-8')
bank=json.loads(source('bank.json')) if (root/'web/bank.json').exists() else []
code="const BANK="+json.dumps(bank,ensure_ascii=False,separators=(',',':')).replace('<',r'\u003c')+";\n"
code+="const curriculum="+json.dumps(knowledge_content(bank),ensure_ascii=False,separators=(",",":")).replace("<",r"\u003c")+";\n"
topics=[line.split('|') for line in (root/'tools/writing-topics.txt').read_text().splitlines()]
assert len(topics)==len({row[0] for row in topics})==100
code+="const writingTopics="+json.dumps(topics,ensure_ascii=False)+";\n"
models=[line.split('|') for line in (root/'tools/model-texts.txt').read_text().splitlines()]
assert all(len(m)==7 for m in models)
code+='const modelTexts='+json.dumps(models,ensure_ascii=False)+';\n'
code+='const teachingNotes='+json.dumps(explanation_notes(bank),ensure_ascii=False).replace('<',r'\u003c')+';\n'
code+='const syncSchema='+json.dumps((root/'supabase/schema.sql').read_text())+';\n'
for name in ('vendor/pako_inflate.js','core.js','docx.js','prompts.js','writing-content.js','topic-picker.js','ui.js','question-types.js','feedback.js','writing.js','records.js','settings.js','progress.js','studio.js','sync.js','knowledge.js','start.js'):
    if (root/'web'/name).exists(): code+=source(name)+'\n'
html=source('index.html').replace('/*STYLE*/',source('style.css')).replace('/*CODE*/',code)
html=html.replace("/*ICON64*/",base64.b64encode((root/"assets/WriteFlow-64.png").read_bytes()).decode("ascii"))
(out/'WriteFlow.html').write_text(html,encoding='utf-8')
