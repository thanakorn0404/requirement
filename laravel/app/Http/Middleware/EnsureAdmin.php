<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return redirect($request->user()?->homePath() ?? '/login')
                ->with('error', 'เฉพาะผู้ดูแลระบบเท่านั้น');
        }

        return $next($request);
    }
}
