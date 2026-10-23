$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$output = Join-Path $root 'dist-store'
$packages = @(Get-ChildItem $output -Filter '*.appx')
if ($packages.Count -ne 1) { throw 'Expected one x64 Store package' }
$package = $packages[0]
$kits = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/bin'
$makeappx = Get-ChildItem "$kits/*/x64/makeappx.exe" | Sort-Object FullName -Descending | Select-Object -First 1
if (-not $makeappx) { throw 'Windows SDK MakeAppx missing' }
$unpack = Join-Path $env:RUNNER_TEMP 'salah-store-inspection'
& $makeappx.FullName unpack /p $package.FullName /d $unpack /o
if ($LASTEXITCODE -ne 0) { throw 'MakeAppx unpack/validation failed' }
[xml]$manifest = Get-Content (Join-Path $unpack 'AppxManifest.xml') -Raw -Encoding utf8
$identity = (node -e "console.log(JSON.stringify(require('./src/core/windows-store').identity))") | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Identity configuration could not be loaded' }
function Assert-Equal($actual, $expected, $field) {
  if ($actual -cne $expected) { throw "Unexpected ${field}: $actual" }
}
Assert-Equal $manifest.Package.Identity.Name $identity.name 'identity name'
Assert-Equal $manifest.Package.Identity.Publisher $identity.publisher 'publisher'
Assert-Equal $manifest.Package.Properties.PublisherDisplayName $identity.publisherDisplayName 'publisher display name'
Assert-Equal $manifest.Package.Properties.DisplayName $identity.displayName 'Arabic product name'
Assert-Equal $manifest.Package.Identity.ProcessorArchitecture 'x64' 'architecture'
$version = (node -p "require('./package.json').version") + '.0'
Assert-Equal $manifest.Package.Identity.Version $version 'version'
$languages = @($manifest.Package.Resources.Resource | ForEach-Object { $_.Language })
if ('ar-SA' -notin $languages -or 'en-US' -notin $languages) { throw 'Arabic/English resources missing' }
$application = $manifest.Package.Applications.Application
Assert-Equal $application.Id $identity.applicationId 'application ID'
Assert-Equal $application.VisualElements.DisplayName $identity.displayName 'Start menu name'
Assert-Equal $application.EntryPoint 'Windows.FullTrustApplication' 'entry point'
$executable = Join-Path $unpack $application.Executable
if (-not (Test-Path $executable)) { throw 'Manifest executable missing' }
$capabilities = @($manifest.Package.Capabilities.Capability | ForEach-Object { $_.Name })
if ('runFullTrust' -notin $capabilities) { throw 'Electron capability missing' }
$startup = @($application.Extensions.Extension | Where-Object { $_.Category -eq 'windows.startupTask' })
if ($startup.Count -ne 1 -or $startup[0].StartupTask.TaskId -ne 'SalahReminderStartup') { throw 'Startup task missing' }
if (-not (Test-Path (Join-Path $unpack $startup[0].Executable))) { throw 'Startup executable missing' }
Add-Type -AssemblyName System.Drawing
foreach ($asset in @{ 'StoreLogo.png' = @(50,50); 'Square44x44Logo.png' = @(44,44); 'Square150x150Logo.png' = @(150,150); 'Wide310x150Logo.png' = @(310,150) }.GetEnumerator()) {
  $image = [System.Drawing.Image]::FromFile((Join-Path $unpack "assets/$($asset.Key)"))
  try { if ($image.Width -ne $asset.Value[0] -or $image.Height -ne $asset.Value[1]) { throw "Wrong tile dimensions: $($asset.Key)" } } finally { $image.Dispose() }
}
Copy-Item (Join-Path $unpack 'AppxManifest.xml') (Join-Path $output 'AppxManifest.xml')
@{ name = $identity.name; publisher = $identity.publisher; publisherDisplayName = $identity.publisherDisplayName; displayName = $identity.displayName; version = $version; architecture = 'x64'; languages = $languages; sha256 = (Get-FileHash $package.FullName -Algorithm SHA256).Hash; package = $package.Name; storeId = $identity.storeId; signedForSideloading = (Test-Path (Join-Path $unpack 'AppxSignature.p7x')); intendedUse = 'Microsoft Store submission' } | ConvertTo-Json | Set-Content (Join-Path $output 'store-verification.json') -Encoding utf8
Get-Content (Join-Path $output 'store-verification.json')
