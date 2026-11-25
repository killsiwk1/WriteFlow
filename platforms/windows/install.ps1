$ErrorActionPreference = 'Stop'
$file = [IO.File]::ReadAllText($env:WRITEFLOW_INSTALLER)
$marker = [Environment]::NewLine + ':WRITEFLOW_PAYLOAD' + [Environment]::NewLine
$offset = $file.LastIndexOf($marker, [StringComparison]::Ordinal)
if ($offset -lt 0) { throw 'Installer payload missing.' }
$bytes = [Convert]::FromBase64String($file.Substring($offset + $marker.Length).Trim())
$sha = [Security.Cryptography.SHA256]::Create()
try { $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose() }
if ($hash -ne '__SHA256__') { throw 'Payload verification failed.' }
$folder = Join-Path $env:LOCALAPPDATA 'Programs\WriteFlow'
[IO.Directory]::CreateDirectory($folder) | Out-Null
$target = Join-Path $folder 'WriteFlow.html'
$temp = Join-Path $folder ([Guid]::NewGuid().ToString()+'.tmp')
try {
    [IO.File]::WriteAllBytes($temp,$bytes)
    if ([IO.File]::Exists($target)) { [IO.File]::Replace($temp,$target,[System.Management.Automation.Language.NullString]::Value) } else { [IO.File]::Move($temp,$target) }
} finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp } }
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Programs')) 'WriteFlow.lnk'))
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $folder
$shortcut.Description = 'Offline English writing and learning'
$shortcut.Save()
Write-Host 'WriteFlow has been installed. Open WriteFlow from your Start menu.'
Start-Process -FilePath $target
