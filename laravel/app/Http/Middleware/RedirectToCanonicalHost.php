<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectToCanonicalHost
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('local')) {
            return $next($request);
        }

        $host = strtolower($request->getHost());
        if (str_ends_with($host, '.ngrok-free.app')
            || str_ends_with($host, '.ngrok-free.dev')
            || str_ends_with($host, '.ngrok.app')
            || str_ends_with($host, '.ngrok.io')
            || str_ends_with($host, '.ngrok.dev')
            || str_ends_with($host, '.trycloudflare.com')
            || str_ends_with($host, '.loca.lt')) {
            return $next($request);
        }

        $canonical = parse_url((string) config('app.url'));
        $canonicalHost = $canonical['host'] ?? null;

        if (! $canonicalHost) {
            return $next($request);
        }

        $canonicalPort = isset($canonical['port'])
            ? (int) $canonical['port']
            : (($canonical['scheme'] ?? 'http') === 'https' ? 443 : 80);

        if (strcasecmp($request->getHost(), $canonicalHost) === 0
            && (int) $request->getPort() === $canonicalPort) {
            return $next($request);
        }

        $target = rtrim((string) config('app.url'), '/').$request->getRequestUri();

        return redirect()->away($target);
    }
}
