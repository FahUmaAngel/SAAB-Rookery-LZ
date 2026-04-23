$ErrorActionPreference = 'Stop'

$Port = 8080
$Root = (Resolve-Path ".").Path

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host "Serving $Root at http://localhost:$Port/"

$contentTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain; charset=utf-8"
}

function Send-Response {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [byte[]]$Body,
        [string]$ContentType = "text/plain; charset=utf-8"
    )

    $headerText = @(
        "HTTP/1.1 $StatusCode $StatusText"
        "Content-Type: $ContentType"
        "Content-Length: $($Body.Length)"
        "Connection: close"
        ""
        ""
    ) -join "`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()

        try {
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                continue
            }

            while (($line = $reader.ReadLine()) -ne '') {
                if ($null -eq $line) { break }
            }

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("400 Bad Request")
                Send-Response -Stream $stream -StatusCode 400 -StatusText "Bad Request" -Body $body
                continue
            }

            $method = $parts[0]
            $pathPart = $parts[1]

            if ($method -ne 'GET' -and $method -ne 'HEAD') {
                $body = [System.Text.Encoding]::UTF8.GetBytes("405 Method Not Allowed")
                Send-Response -Stream $stream -StatusCode 405 -StatusText "Method Not Allowed" -Body $body
                continue
            }

            $relativePath = [System.Uri]::UnescapeDataString(($pathPart.Split('?')[0]).TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $safePath = $relativePath -replace '/', '\'
            $fullPath = Join-Path $Root $safePath

            $rootResolved = [System.IO.Path]::GetFullPath($Root)
            $targetResolved = [System.IO.Path]::GetFullPath($fullPath)

            if (-not $targetResolved.StartsWith($rootResolved, [System.StringComparison]::OrdinalIgnoreCase)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
                Send-Response -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Body $body
                continue
            }

            if ((Test-Path $targetResolved) -and (Get-Item $targetResolved).PSIsContainer) {
                $targetResolved = Join-Path $targetResolved "index.html"
            }

            if (-not (Test-Path $targetResolved)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                Send-Response -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $body
                continue
            }

            $extension = [System.IO.Path]::GetExtension($targetResolved).ToLowerInvariant()
            $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { "application/octet-stream" }
            $bytes = if ($method -eq 'HEAD') { [byte[]]::new(0) } else { [System.IO.File]::ReadAllBytes($targetResolved) }

            Send-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $bytes -ContentType $contentType
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Dispose()
        }
    }
}
finally {
    $listener.Stop()
}
