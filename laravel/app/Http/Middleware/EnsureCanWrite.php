<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanWrite
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->canWrite()) {
            return back()->with('error', 'บัญชีนี้สามารถดูข้อมูลได้อย่างเดียว');
        }

        return $next($request);
    }
}
