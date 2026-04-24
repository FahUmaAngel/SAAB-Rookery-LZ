param(
  [string]$Root = (Get-Location).Path,
  [int]$Port = 8080
)

$rootFull = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Parse('127.0.0.1'), $Port)
$listener.Start()
Write-Host "Serving $rootFull on http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Open: http://localhost:$Port/intel-brief.html" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.json' = 'application/json; charset=utf-8'
}

function Send-Response($stream, [string]$status, [string]$type, [byte[]]$body) {
  $header = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($body, 0, $body.Length)
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 2000
    $client.SendTimeout    = 2000
    $stream = $client.GetStream()
    $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
    $request = $reader.ReadLine()

    if ([string]::IsNullOrWhiteSpace($request)) { $client.Close(); continue }

    while ($stream.DataAvailable) { $line = $reader.ReadLine(); if ($line -eq '') { break } }

    $target = '/'
    if ($request -match '^[A-Z]+\s+([^\s]+)') { $target = $matches[1] }

    $target = [Uri]::UnescapeDataString($target.Split('?')[0].TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($target)) { $target = 'index.html' }

    $path = [IO.Path]::GetFullPath([IO.Path]::Combine($rootFull, $target.Replace('/', [IO.Path]::DirectorySeparatorChar)))
    if (-not $path.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      Send-Response $stream '403 Forbidden' 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('Forbidden'))
      continue
    }

    if ([IO.Directory]::Exists($path)) { $path = [IO.Path]::Combine($path, 'index.html') }

    if (-not [IO.File]::Exists($path)) {
      Write-Host "404 $target" -ForegroundColor DarkGray
      Send-Response $stream '404 Not Found' 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('Not Found'))
      continue
    }

    Write-Host "200 $target" -ForegroundColor DarkGray
    $body = [IO.File]::ReadAllBytes($path)
    $ext  = [IO.Path]::GetExtension($path).ToLowerInvariant()
    $type = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
    Send-Response $stream '200 OK' $type $body
  } catch {
    try { Send-Response $stream '500 Internal Server Error' 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('Server error')) } catch {}
  } finally {
    $client.Close()
  }
}
