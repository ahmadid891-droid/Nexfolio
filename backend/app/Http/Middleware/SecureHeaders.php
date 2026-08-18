<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecureHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if (config('app.env') === 'production') {
            $response->headers->set('Content-Security-Policy', $this->csp());
        }

        return $response;
    }

    protected function csp(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com https://ui-avatars.com",
            "connect-src 'self'",
            "frame-src https://app.sandbox.midtrans.com https://app.midtrans.com",
            "font-src 'self' data:",
            "object-src 'none'",
            "base-uri 'self'",
        ]);
    }
}
