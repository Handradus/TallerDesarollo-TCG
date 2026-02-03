# Elimina las reglas de firewall creadas por add-firewall-rules.ps1
# Ejecutar en PowerShell como Administrador:
#   cd backend\scripts
#   .\remove-firewall-rules.ps1

$names = @('TallerBackend3000','TallerFrontend5173')

foreach ($n in $names) {
    $rule = Get-NetFirewallRule -DisplayName $n -ErrorAction SilentlyContinue
    if ($null -ne $rule) {
        try {
            Remove-NetFirewallRule -DisplayName $n
            Write-Host "Regla eliminada: $n" -ForegroundColor Green
        } catch {
            Write-Host "ERROR eliminando regla $n: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "No existe regla: $n" -ForegroundColor Yellow
    }
}

Write-Host "Operación finalizada." -ForegroundColor Cyan
