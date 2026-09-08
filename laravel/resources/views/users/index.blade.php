@extends('layouts.app')
@section('content')
<x-page-head kicker="สิทธิ์การเข้าใช้" title="ผู้ใช้งาน" text="กำหนดสิทธิ์ ADMIN / EDITOR / VIEWER">
    <button class="btn" onclick="document.getElementById('u').showModal()">เพิ่มผู้ใช้</button>
</x-page-head>
<div class="table-wrap">
    <table class="table">
        <thead><tr><th>ชื่อ</th><th>Username</th><th>สิทธิ์</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>
        @forelse($users as $item)
            <tr>
                <td class="font-semibold">{{ $item->name }}</td>
                <td>{{ $item->username }}</td>
                <td><x-status :value="$item->role" /></td>
                <td><x-status :value="$item->status" /></td>
                <td class="text-right">
                    <form method="post" action="/admin/users/{{ $item->id }}" data-confirm="ลบผู้ใช้นี้หรือไม่? การเข้าสู่ระบบจะใช้ไม่ได้ทันที" data-confirm-title="ลบผู้ใช้">
                        @csrf @method('delete')<button class="btn ghost">ลบ</button>
                    </form>
                </td>
            </tr>
        @empty
            <tr><td colspan="5"><x-empty title="ยังไม่มีผู้ใช้" /></td></tr>
        @endforelse
        </tbody>
    </table>
</div>
<x-dialog id="u" title="สร้างผู้ใช้" subtitle="PIN 6 หลักใช้เข้าสู่ระบบแทนรหัสผ่าน">
    <form method="post" action="/admin/users">
        @csrf
        <input type="hidden" name="_dialog" value="u">
        <label>ชื่อ-สกุล</label>
        <input class="input" name="name" value="{{ old('name') }}" required>
        <label>Username</label>
        <input class="input" name="username" value="{{ old('username') }}" required>
        <label>อีเมล</label>
        <input class="input" type="email" name="email" value="{{ old('email') }}" required>
        <label>PIN 6 หลัก</label>
        <input class="input" name="pin" value="{{ old('pin') }}" required maxlength="6" inputmode="numeric">
        <label>สิทธิ์</label>
        <select class="input" name="role">
            @foreach(['ADMIN'=>'ผู้ดูแลระบบ','EDITOR'=>'ผู้แก้ไข','VIEWER'=>'ผู้ดู'] as $role=>$label)
                <option value="{{ $role }}" @selected(old('role')===$role)>{{ $role }} — {{ $label }}</option>
            @endforeach
        </select>
        <div class="dialog-actions"><button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button><button class="btn">สร้างผู้ใช้</button></div>
    </form>
</x-dialog>
@endsection
