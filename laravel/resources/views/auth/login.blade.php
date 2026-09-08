@extends('layouts.guest')
@section('content')
<div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-sts via-sts-dark to-sts-navy"></div>
    <div class="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
    <div class="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-300/20 blur-3xl"></div>

    <div class="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2">
        <section class="text-white">
            <div class="mb-8 flex items-center gap-3">
                <div class="grid h-14 w-14 place-items-center rounded-2xl bg-white text-sm font-extrabold tracking-widest text-sts-navy shadow-xl">STS</div>
                <div>
                    <div class="text-sm font-bold tracking-[0.2em]">STS BBS</div>
                    <div class="text-sm text-white/70">ระบบสารบรรณดิจิทัลสำหรับองค์กรปกครองส่วนท้องถิ่น</div>
                </div>
            </div>
            <h1 class="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">ระบบจัดเก็บ Requirement สารบรรณ</h1>
            <p class="mt-4 max-w-lg text-base leading-7 text-white/75">จัดเก็บกระบวนการทำงานของหน่วยงานท้องถิ่น ออกแบบการเดินหนังสือ และผูก Requirement กับงาน ตำแหน่ง และหน้าที่</p>
            <ul class="mt-8 space-y-3 text-sm text-white/90">
                @foreach(['หน่วยงาน / ผังองค์กร และบทบาทหน้าที่', 'ออกแบบ Workflow และ Block', 'เก็บ Version และ Audit Log ทุกครั้ง'] as $item)
                    <li class="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
                        <span class="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-sts">✓</span>
                        {{ $item }}
                    </li>
                @endforeach
            </ul>
        </section>

        <form class="rounded-[2rem] bg-white p-8 shadow-2xl shadow-black/25 ring-1 ring-white/70" method="post" action="/login" id="login-form">
            @csrf
            <p class="text-sm font-semibold text-sts">ยินดีต้อนรับ</p>
            <h2 class="mt-1 text-2xl font-bold text-sts-deep">เข้าสู่ระบบ</h2>
            <p class="muted mt-1">ใส่ Username แล้วกรอก PIN 6 หลัก หรือวาง PIN ทั้งชุดได้</p>
            @if(session('error')) <div class="flash err mt-4">{{ session('error') }}</div> @endif
            @if($errors->any()) <div class="flash err mt-4">{{ $errors->first() }}</div> @endif
            <label class="mt-6">ชื่อผู้ใช้</label>
            <input class="input" name="username" value="{{ old('username') }}" required autofocus autocomplete="username">
            <div class="mt-5 mb-2 text-sm font-medium text-stone-600">PIN 6 หลัก</div>
            <div class="grid grid-cols-6 gap-2" id="pins">
                @for($i=0;$i<6;$i++)
                    <input class="h-14 rounded-2xl bg-sts-soft text-center text-xl font-bold text-sts-deep ring-1 ring-sts-border transition focus:bg-white focus:ring-2 focus:ring-sts" maxlength="1" inputmode="numeric" autocomplete="one-time-code" data-i="{{ $i }}" aria-label="PIN หลักที่ {{ $i+1 }}">
                @endfor
            </div>
            <input type="hidden" name="pin" id="pin">
            <button class="btn mt-6 w-full py-3">เข้าสู่ระบบ</button>
        </form>
    </div>
</div>
<script>
const inputs = [...document.querySelectorAll('#pins input')];
const hidden = document.getElementById('pin');
const form = document.getElementById('login-form');
const sync = () => { hidden.value = inputs.map(x => x.value).join(''); };
inputs.forEach((el, i) => {
  el.addEventListener('input', () => {
    el.value = el.value.replace(/\D/g,'').slice(0,1);
    if (el.value && inputs[i+1]) inputs[i+1].focus();
    sync();
    if (hidden.value.length === 6) form.submit();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !el.value && inputs[i-1]) inputs[i-1].focus();
  });
  el.addEventListener('paste', (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g,'').slice(0,6);
    if (!text) return;
    e.preventDefault();
    text.split('').forEach((ch, idx) => { if (inputs[idx]) inputs[idx].value = ch; });
    sync();
    (inputs[Math.min(text.length, 5)] || inputs[5]).focus();
    if (hidden.value.length === 6) form.submit();
  });
});
</script>
@endsection
