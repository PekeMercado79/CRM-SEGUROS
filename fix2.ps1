$lines = Get-Content "src\crm-seguros-v14.jsx"
$out = @()
$skip = $false
$i = 0

foreach ($line in $lines) {
    $i++
    # Saltar bloque gmailSend (lineas 2403-2419)
    if ($i -eq 2403) { $out += "  // Bienvenida automatica"; $skip = $true }
    if ($i -eq 2420) { $skip = $false }
    # Saltar bloque useGmailAuth+ConfigGmail (lineas 6392-6500)
    if ($i -eq 6392) { $skip = $true }
    if ($i -ge 6392 -and $line -match "^function Configuracion") { $skip = $false }
    
    if (-not $skip) { $out += $line }
}

$out | Set-Content "src\crm-seguros-v14.jsx" -Encoding UTF8
Write-Host "Hecho - $($out.Count) lineas"
```

Guárdalo como `fix2.ps1` en `C:\Users\PC\Documents\CRM-SEGUROS` con tipo **Todos los archivos**. Luego ejecuta:
```
.\fix2.ps1