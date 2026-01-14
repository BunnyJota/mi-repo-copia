$url = 'https://signdzrwijfpxpvqragx.supabase.co'
$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ25kenJ3aWpmcHhwdnFyYWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzE0NzksImV4cCI6MjA4MTQwNzQ3OX0.tvFThuTBEUTE43AA4BGLzgk9-kVK5hxsL1rMTO6CMHI'

function CallApi($uri, $method='GET', $body=$null) {
  $h = @{ 'apikey'=$key; 'Authorization'="Bearer $key" }
  if ($method -eq 'GET') {
    return Invoke-RestMethod -Method Get -Uri $uri -Headers $h
  } else {
    $h['Content-Type'] = 'application/json'
    $h['Prefer'] = 'return=representation'
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $h -Body $body
  }
}

Write-Host '1) services'
$svcUri = "$url/rest/v1/services?select=id,barbershop_id&is_active=eq.true&limit=1"
$svc = CallApi $svcUri
$barbershop = $svc[0].barbershop_id
$service = $svc[0].id
Write-Host "barbershop=$barbershop service=$service"

Write-Host '2) staff_profiles'
$staffUri = "$url/rest/v1/staff_profiles?select=user_id&is_active=eq.true&barbershop_id=eq.$barbershop&limit=1"
$staff = CallApi $staffUri
if (-not $staff) {
  $staff = CallApi "$url/rest/v1/staff_profiles?select=user_id&is_active=eq.true&limit=1"
}
if (-not $staff) {
  throw "No hay staff activo disponible"
}
$staffUser = $staff[0].user_id
Write-Host "staff_user=$staffUser"

Write-Host '3) insert client'
$clientBody = @{barbershop_id=$barbershop; name='Test Public'; email='public-test-' + (Get-Random) + '@example.com'; phone='12345'} | ConvertTo-Json
$client = CallApi "$url/rest/v1/clients" 'POST' $clientBody
$clientId = $client.id
Write-Host "client_id=$clientId"

Write-Host '4) insert appointment'
$start = (Get-Date).ToUniversalTime().AddHours(2).ToString('o')
$end = (Get-Date).ToUniversalTime().AddHours(3).ToString('o')
$appBody = @{barbershop_id=$barbershop; client_id=$clientId; staff_user_id=$staffUser; start_at=$start; end_at=$end; total_price_estimated=500; status='pending'} | ConvertTo-Json
try {
  $app = CallApi "$url/rest/v1/appointments" 'POST' $appBody
  $appId = $app.id
  Write-Host "appointment_id=$appId"
} catch {
  Write-Warning "appointment insert failed: $($_.Exception.Message)"
  if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Warning "body: $($reader.ReadToEnd())"
  }
  throw
}

Write-Host '5) insert appointment_services'
$svcBody = @(@{appointment_id=$appId; service_id=$service; qty=1}) | ConvertTo-Json
$svcInsert = CallApi "$url/rest/v1/appointment_services" 'POST' $svcBody
$svcInsert | ConvertTo-Json -Depth 5
