# Añade reglas de firewall para el backend (3000) y frontend (5173)
# Ejecutar en PowerShell como Administrador:
#   cd backend\scripts
#   .\add-firewall-rules.ps1

$rules = @(
    @{ Name = 'TallerBackend3000'; Port = 3000 },
    @{ Name = 'TallerFrontend5173'; Port = 5173 }
)

foreach ($r in $rules) {
    $exists = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($null -ne $exists) {
        Write-Host "Regla ya existe: $($r.Name) (puerto $($r.Port))" -ForegroundColor Yellow
    } else {
        try {
            New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -LocalPort $r.Port -Protocol TCP -Action Allow -Profile Any -Enabled True
            Write-Host "Regla creada: $($r.Name) (puerto $($r.Port))" -ForegroundColor Green
        } catch {
            Write-Host "ERROR creando regla $($r.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host "Listo. Si usas reglas con nombre distinto ajusta los nombres en este script." -ForegroundColor Cyan
