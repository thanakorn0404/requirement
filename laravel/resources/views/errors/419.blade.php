@extends('layouts.guest')
@section('content')
<div class="relative grid min-h-screen place-items-center overflow-hidden px-6">
    <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-sts via-sts-dark to-sts-navy"></div>
    <div class="relative w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
        <p class="text-sm font-semibold text-sts">419</p>
        <h1 class="mt-1 text-2xl font-bold text-sts-deep">เซสชันหมดอายุ</h1>
        <p class="muted mt-3">กรุณาโหลดหน้าเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง โดยใช้ที่อยู่เดียวกันตลอด เช่น http://localhost:8000</p>
        <a class="btn mt-6 inline-flex py-3" href="{{ url('/login') }}">กลับไปเข้าสู่ระบบ</a>
    </div>
</div>
@endsection
