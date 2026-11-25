"""Make a portable per-user offline installer using Windows' built-in PowerShell."""
from pathlib import Path
from base64 import b64encode,b64decode
import hashlib,textwrap
root=Path(__file__).resolve().parents[1]
data=(root/'dist/WriteFlow.html').read_bytes()
digest=hashlib.sha256(data).hexdigest()
ps=(root/'platforms/windows/install.ps1').read_text().replace('__SHA256__',digest)
# Load the readable script section without an oversized command line.
cmd="""@echo off
setlocal
set "WRITEFLOW_INSTALLER=%~f0"
powershell.exe -NoLogo -NoProfile -Command "$f=[IO.File]::ReadAllText($env:WRITEFLOW_INSTALLER); $n=[Environment]::NewLine; $s=$f.IndexOf($n+':WRITEFLOW_SCRIPT'+$n)+18+$n.Length*2-2; $e=$f.LastIndexOf($n+':WRITEFLOW_PAYLOAD'+$n); & ([scriptblock]::Create($f.Substring($s,$e-$s)))"
if errorlevel 1 (
 echo Installation failed.
 pause
 exit /b 1
)
exit /b 0
:WRITEFLOW_SCRIPT
"""
cmd=cmd.replace("$s=$f.IndexOf($n+':WRITEFLOW_SCRIPT'+$n)+18+$n.Length*2-2","$m=$n+':WRITEFLOW_SCRIPT'+$n; $s=$f.IndexOf($m)+$m.Length")
payload='\n'.join(textwrap.wrap(b64encode(data).decode(),76))
pack=(cmd+ps.rstrip()+'\n:WRITEFLOW_PAYLOAD\n'+payload+'\n').replace('\n','\r\n').encode('ascii')
out=root/'dist/WriteFlow-Windows-Setup.cmd';out.write_bytes(pack)
assert b64decode(pack.split(b'\r\n:WRITEFLOW_PAYLOAD\r\n')[1])==data
print(out.name, digest)
