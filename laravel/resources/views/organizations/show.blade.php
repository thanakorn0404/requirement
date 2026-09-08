@extends('layouts.app')
@section('content')
<a class="back-link" href="/admin/organizations">← กลับไปหน่วยงาน</a>
<x-page-head :title="$organization->name" :text="$organization->type.' · จังหวัด'.$organization->province">
    @if(auth()->user()->canWrite())
        <button class="btn" onclick="document.getElementById('create-dept').showModal()">เพิ่มกอง / สำนัก</button>
    @endif
</x-page-head>
<div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div class="stat-card"><div class="muted">กอง / สำนัก</div><div class="stat-value">{{ $departmentCount }}</div></div>
    <div class="stat-card"><div class="muted">บุคลากร</div><div class="stat-value">{{ $personCount }}</div></div>
    <div class="stat-card"><div class="muted">การเดินหนังสือ</div><div class="stat-value">{{ $workflowCount }}</div></div>
    <div class="stat-card"><div class="muted">ความต้องการ</div><div class="stat-value">{{ $requirementCount }}</div></div>
</div>
@if(auth()->user()->isAdmin())
<form method="post" action="/admin/organizations/{{ $organization->id }}" class="card card-pad mb-6">
    @csrf @method('put')
    <h3 class="section-title">ข้อมูลหน่วยงาน</h3>
    <div class="grid gap-3 md:grid-cols-2">
        <div><label>ชื่อ</label><input class="input" name="name" value="{{ $organization->name }}"></div>
        <div><label>ประเภท</label><input class="input" name="type" value="{{ $organization->type }}"></div>
    </div>
    <label>จังหวัด</label><input class="input" name="province" value="{{ $organization->province }}">
    <label>ที่อยู่</label><textarea class="input" name="address">{{ $organization->address }}</textarea>
    <button class="btn mt-5">บันทึกข้อมูล</button>
</form>
@endif
<div class="card card-pad">
    <h3 class="section-title">กอง / สำนัก</h3>
    @forelse($organization->departments as $dept)
        <a href="/admin/organizations/{{ $organization->id }}/departments/{{ $dept->id }}" class="list-row">
            <div>
                <strong>{{ $dept->name }}</strong>
                <div class="muted">{{ $dept->type }} {{ $dept->code }}</div>
            </div>
            <span class="text-sts">→</span>
        </a>
    @empty
        <x-empty title="ยังไม่มีกอง / สำนัก" text="สร้างกองเพื่อเริ่มจัดบุคลากรและการเดินหนังสือ" />
    @endforelse
</div>
<x-dialog id="create-dept" title="สร้างกอง / สำนัก" subtitle="ใช้สำหรับจัดกลุ่มงาน บุคลากร และการเดินหนังสือ">
    <form method="post" action="/admin/organizations/{{ $organization->id }}/departments">
        @csrf
        <input type="hidden" name="_dialog" value="create-dept">
        <label>ชื่อกอง / สำนัก</label>
        <input class="input" name="name" value="{{ old('name') }}" required>
        <label>รหัส</label>
        <input class="input" name="code" value="{{ old('code') }}">
        <label>ประเภท</label>
        <select class="input" name="type">
            @foreach(['กอง','สำนัก','ฝ่าย','งาน','อื่นๆ'] as $type)
                <option @selected(old('type')===$type)>{{ $type }}</option>
            @endforeach
        </select>
        <div class="dialog-actions">
            <button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button>
            <button class="btn">สร้าง</button>
        </div>
    </form>
</x-dialog>
@endsection
