$lines = Get-Content "src\crm-seguros-v14.jsx"
$new = New-Object System.Collections.ArrayList
$i = 0
$skip = $false
foreach ($line in $lines) {
    $i++
    if ($i -eq 2404) { $skip = $true }
    if ($i -eq 2420) { $skip = $false; [void]$new.Add("  // Bienvenida automatica") }
    if ($i -eq 6396) { $skip = $true }
    if ($skip -eq $true -and $line -match "^function Configuracion") { $skip = $false }
    if (-not $skip) { [void]$new.Add($line) }
}
$new | Set-Content "src\crm-seguros-v14.jsx" -Encoding UTF8
Write-Host "Hecho $($new.Count) lineas"