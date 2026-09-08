@extends('layouts.app')
@section('content')
<x-page-head kicker="บัญชีผู้ใช้" title="ตั้งค่า / เปลี่ยน PIN" text="PIN 6 หลักใช้ยืนยันตัวตนทุกครั้งที่เข้าสู่ระบบ" />
<form method="post" action="/settings/pin" class="card card-pad max-w-md">
    @csrf
    <label>PIN ปัจจุบัน</label>
    <input class="input tracking-[0.4em]" name="current_pin" maxlength="6" inputmode="numeric" autocomplete="off" required>
    <label>PIN ใหม่</label>
    <input class="input tracking-[0.4em]" name="new_pin" maxlength="6" inputmode="numeric" autocomplete="off" required>
    <p class="muted mt-3">หลังเปลี่ยนแล้ว ให้ใช้ PIN ใหม่ในการเข้าสู่ระบบครั้งถัดไป</p>
    <button class="btn mt-5">บันทึก PIN</button>
</form>
@endsection
