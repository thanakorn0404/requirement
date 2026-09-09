<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'STS BBS · ระบบจัดเก็บ Requirement สารบรรณ')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen" @if(old('_dialog')) data-reopen-dialog="{{ old('_dialog') }}" @endif>
@php
    $user = auth()->user();
    $path = request()->path();
    $home = $user?->homePath() ?? '/login';
    $nav = [
        ['แดชบอร์ด', $home, $path === 'admin' || $path === 'dashboard', 'M3 12l9-9 9 9M5 10v10h14V10'],
        ['หน่วยงาน', '/admin/organizations', str_starts_with($path, 'admin/organizations'), 'M3 21V7l9-4 9 4v14M9 21v-6h6v6'],
        ['การเดินหนังสือ', '/admin/workflows', $path === 'admin/workflows', 'M7 7h10M7 12h10M7 17h6'],
        ['ความต้องการของระบบ', '/admin/requirements', $path === 'admin/requirements', 'M9 5h12M9 12h12M9 19h12M4 5h.01M4 12h.01M4 19h.01'],
    ];
@endphp
<div class="min-h-screen lg:flex">
    <div id="sidebar-overlay" class="fixed inset-0 z-30 hidden bg-sts-navy/40 backdrop-blur-sm lg:hidden"></div>
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col text-white transition duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0">
        <div class="relative flex h-full flex-col overflow-hidden bg-linear-to-b from-sts via-sts-dark to-sts-navy">
            <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
            <div class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-6">
                <div class="flex items-center gap-3">
                    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-extrabold tracking-widest text-sts-navy shadow-lg">STS</div>
                    <div>
                        <div class="text-sm font-bold tracking-[0.18em]">STS BBS</div>
                        <div class="text-xs text-white/70">ระบบสารบรรณดิจิทัล</div>
                    </div>
                </div>
                <button id="sidebar-close" type="button" class="rounded-xl p-2 text-white/80 hover:bg-white/10 lg:hidden">✕</button>
            </div>
            <nav class="flex flex-1 flex-col gap-1 p-4">
                @foreach($nav as $item)
                    <a class="nav-link {{ $item[2] ? 'active' : '' }}" href="{{ $item[1] }}">
                        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="{{ $item[3] }}"/></svg>
                        {{ $item[0] }}
                    </a>
                @endforeach
                @if($user?->isAdmin())
                    <a class="nav-link {{ $path === 'admin/users' ? 'active' : '' }}" href="/admin/users">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        ผู้ใช้งาน
                    </a>
                    <a class="nav-link {{ $path === 'admin/audit-logs' ? 'active' : '' }}" href="/admin/audit-logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ประวัติการใช้งาน
                    </a>
                @endif
                <a class="nav-link {{ str_contains($path, 'settings') ? 'active' : '' }}" href="{{ $user?->isAdmin() ? '/admin/settings' : '/dashboard/settings' }}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15l1.6 2.8-1.8 1.8-2.8-1.1M4.6 15L3 17.8l1.8 1.8 2.8-1.1M15 4.6L17.8 3l1.8 1.8-1.1 2.8M9 4.6L6.2 3 4.4 4.8l1.1 2.8"/></svg>
                    ตั้งค่า
                </a>
            </nav>
            <div class="p-4 pt-0">
                <div class="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <div class="truncate text-sm font-semibold">{{ $user?->name }}</div>
                    <div class="mt-0.5 text-xs text-white/70">{{ $user?->role }}</div>
                </div>
                <form method="post" action="/logout" class="mt-2">
                    @csrf
                    <button type="submit" class="nav-link w-full">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H3m12 0l-4-4m4 4l-4 4m6-9V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                        ออกจากระบบ
                    </button>
                </form>
            </div>
        </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl">
            <div class="h-1 bg-linear-to-r from-sts via-sts-dark to-sts-navy"></div>
            <div class="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
                <div class="flex items-center gap-3">
                    <button id="sidebar-toggle" type="button" class="rounded-2xl p-2 text-sts-deep ring-1 ring-sts-border lg:hidden">☰</button>
                    <div>
                        <div class="font-bold text-sts-deep">ระบบจัดเก็บ Requirement สารบรรณ</div>
                        <div class="hidden text-xs text-stone-500 sm:block">STS System & Development · หน่วยงานท้องถิ่น</div>
                    </div>
                </div>
                <form action="/search" method="get" class="flex min-w-0 items-center gap-3">
                    <div class="relative w-40 sm:w-56 md:w-80">
                        <input class="input w-full rounded-full pl-10" name="q" value="{{ request('q') }}" placeholder="ค้นหาหน่วยงาน งานเดินหนังสือ...">
                        <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/></svg>
                    </div>
                    <div class="badge grid h-9 max-w-none place-items-center truncate rounded-full px-3 sm:max-w-none">{{ $user?->name }}</div>
                </form>
            </div>
        </header>
        <main class="app-main">
            @if(session('success')) <div class="flash ok">{{ session('success') }}</div> @endif
            @if(session('error')) <div class="flash err">{{ session('error') }}</div> @endif
            @if($errors->any()) <div class="flash err">{{ $errors->first() }}</div> @endif
            @yield('content')
        </main>
    </div>
</div>
<x-overlays />
</body>
</html>
