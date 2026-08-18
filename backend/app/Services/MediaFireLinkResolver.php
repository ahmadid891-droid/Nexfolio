<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MediaFireLinkResolver
{
    protected const ALLOWED_HOST_SUFFIX = 'mediafire.com';

    public function resolve(string $pageUrl): string
    {
        $host = parse_url($pageUrl, PHP_URL_HOST);

        if (! $host || ! str_ends_with(strtolower($host), self::ALLOWED_HOST_SUFFIX)) {
            throw new \RuntimeException('URL harus berasal dari mediafire.com.');
        }

        $response = Http::timeout(20)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ])
            ->get($pageUrl);

        if (! $response->successful()) {
            throw new \RuntimeException('Gagal mengambil halaman MediaFire (HTTP '.$response->status().').');
        }

        $html = $response->body();
        $link = $this->extract($html);

        if (! $link) {
            throw new \RuntimeException(
                'Tidak dapat mengekstrak direct link dari halaman tersebut. Pastikan link file MediaFire bersifat publik (bukan folder atau file privat).'
            );
        }

        return $link;
    }

    protected function extract(string $html): ?string
    {
        $patterns = [
            '/"direct_download"\s*:\s*"([^"]+)"/',
            '/https?:\/\/download\d*\.mediafire\.com\/[^"\'\\\s]+/',
            '/"normal_download"\s*:\s*"([^"]+)"/',
            '/<a[^>]+href="(https?:\/\/download\d*\.mediafire\.com\/[^"]+)"/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $m)) {
                $candidate = $m[1] ?? $m[0];

                if (str_starts_with($candidate, 'https://download') || str_starts_with($candidate, 'http://download')) {
                    return html_entity_decode($candidate, ENT_QUOTES);
                }
            }
        }

        return null;
    }
}
