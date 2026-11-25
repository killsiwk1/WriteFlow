import sys,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
folder=Path(sys.argv[1])
with zipfile.ZipFile(folder/'out.docx') as z:
    assert z.testzip() is None
    for name in ('[Content_Types].xml','_rels/.rels','word/document.xml'): ET.fromstring(z.read(name))
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    xml=ET.fromstring(z.read('word/document.xml'))
    assert '\n'.join(''.join(p.itertext()) for p in xml.findall('.//w:p',ns))==sys.argv[2]
    with zipfile.ZipFile(folder/'compressed.docx','w',zipfile.ZIP_DEFLATED) as compressed:
        for name in z.namelist(): compressed.writestr(name,z.read(name))
