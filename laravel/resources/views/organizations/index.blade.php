@extends('layouts.app')
@section('content')
<x-page-head kicker="องค์กรปกครองส่วนท้องถิ่น" title="หน่วยงานท้องถิ่น" text="ค้นหาและจัดการหน่วยงานที่เก็บกระบวนการเดินหนังสือ">
    @if(auth()->user()->isAdmin())
        <button class="btn" onclick="document.getElementById('create-org').showModal()">เพิ่มหน่วยงาน</button>
    @endif
</x-page-head>
<form method="get" class="card card-pad mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
    <div>
        <label>ค้นหา</label>
        <input class="input" name="search" value="{{ request('search') }}" placeholder="ชื่อหน่วยงาน">
    </div>
    <div>
        <label>ประเภท</label>
        <select name="type" class="input">
            <option value="">ทุกประเภท</option>
            @foreach(['อบต.','เทศบาลตำบล','เทศบาลเมือง','เทศบาลนคร','อื่นๆ'] as $type)
                <option value="{{ $type }}" @selected(request('type')===$type)>{{ $type }}</option>
            @endforeach
        </select>
    </div>
    <div>
        <label>จังหวัด</label>
        <select name="province" class="input">
            <option value="">ทุกจังหวัด</option>
            @foreach($provinces as $province)
                <option value="{{ $province }}" @selected(request('province')===$province)>{{ $province }}</option>
            @endforeach
        </select>
    </div>
    <button class="btn secondary h-[42px]">ค้นหา</button>
</form>
<div class="grid gap-4 md:grid-cols-2">
    @forelse($organizations as $item)
        <a class="card card-pad transition hover:-translate-y-0.5 hover:shadow-xl" href="/admin/organizations/{{ $item->id }}">
            <div class="flex items-start justify-between gap-3">
                <strong class="text-lg text-sts-deep">{{ $item->name }}</strong>
                <x-status :value="$item->status" />
            </div>
            <div class="muted mt-2">{{ $item->type }} · จังหวัด{{ $item->province }}</div>
        </a>
    @empty
        <div class="card md:col-span-2">
            <x-empty title="ไม่พบหน่วยงาน" text="ลองเปลี่ยนคำค้นหรือเพิ่มหน่วยงานใหม่" />
        </div>
    @endforelse
</div>
{{ $organizations->links() }}
<x-dialog id="create-org" title="เพิ่มหน่วยงาน" subtitle="กรอกข้อมูลหน่วยงานท้องถิ่นเพื่อเริ่มจัดเก็บกระบวนการ">
    <form method="post" action="/admin/organizations">
        @csrf
        <input type="hidden" name="_dialog" value="create-org">
        <label>ชื่อหน่วยงาน</label>
        <input class="input" name="name" value="{{ old('name') }}" required>
        <label>ประเภท</label>
        <select class="input" name="type">
            @foreach(['อบต.','เทศบาลตำบล','เทศบาลเมือง','เทศบาลนคร','อื่นๆ'] as $type)
                <option @selected(old('type')===$type)>{{ $type }}</option>
            @endforeach
        </select>
        <div class="grid gap-3 sm:grid-cols-3">
            <div><label>จังหวัด</label><input class="input" name="province" value="{{ old('province') }}"></div>
            <div><label>อำเภอ</label><input class="input" name="district" value="{{ old('district') }}"></div>
            <div><label>ตำบล</label><input class="input" name="subdistrict" value="{{ old('subdistrict') }}"></div>
        </div>
        <div class="dialog-actions">
            <button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button>
            <button class="btn">สร้างหน่วยงาน</button>
        </div>
    </form>
</x-dialog>
@endsection
