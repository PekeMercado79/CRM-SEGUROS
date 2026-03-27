$file = "src\crm-seguros-v14.jsx"
$content = Get-Content $file -Raw -Encoding UTF8

# Eliminar bloque gmailSend
$content = $content -replace '(?s)  // Bienvenida automática\r?\n  // Helper para enviar con Gmail desde cualquier componente\r?\n  const gmailSend.*?return res\.ok;\r?\n  };', '  // Bienvenida automática'

# Restaurar botón email bienvenida
$content = $content -replace '(?s)\{showBienvenida\.tieneEmail&&\(\r?\n\s*<button onClick=\{async\(\)=>\{.*?✉️ Enviar correo\r?\n\s*</button>\r?\n\s*\)\}', '{showBienvenida.tieneEmail&&(<button onClick={()=>{enviarBienvenidaEmail(showBienvenida.poliza);setShowBienvenida(null);}} style={{flex:2,background:"#2563eb",border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✉️ Enviar por Email</button>)}'

Set-Content $file $content -Encoding UTF8
Write-Host "Listo"