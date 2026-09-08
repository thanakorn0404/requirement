@extends('layouts.app')
@section('content')
<a class="back-link" href="/admin/organizations/{{ $organization->id }}">← กลับไปหน่วยงาน</a>
<x-page-head :title="$department->name" :text="$organization->name">
    @if(auth()->user()->canWrite())
        <button class="btn secondary" onclick="document.getElementById('pos').showModal()">สร้างตำแหน่ง</button>
        <button class="btn secondary" onclick="document.getElementById('per').showModal()">สร้างบุคลากร</button>
        <button class="btn" onclick="document.getElementById('wf').showModal()">สร้างการเดินหนังสือ</button>
    @endif
</x-page-head>
<div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div class="stat-card"><div class="muted">ตำแหน่ง</div><div class="stat-value">{{ $department->positions->count() }}</div></div>
    <div class="stat-card"><div class="muted">บุคลากร</div><div class="stat-value">{{ $department->people->count() }}</div></div>
    <div class="stat-card"><div class="muted">การเดินหนังสือ</div><div class="stat-value">{{ $department->workflows->count() }}</div></div>
    <div class="stat-card"><div class="muted">ความต้องการ</div><div class="stat-value">{{ $requirements->count() }}</div></div>
</div>
<div class="grid gap-4 lg:grid-cols-2">
    <div class="card card-pad">
        <h3 class="section-title">ตำแหน่ง</h3>
        @forelse($department->positions as $item)
            <div class="list-row items-start">
                <div>
                    <div>{{ $item->name }}</div>
                    @if($item->code)<div class="muted">{{ $item->code }}</div>@endif
                    @if($item->description)<div class="muted mt-1">{{ $item->description }}</div>@endif
                </div>
                @if(auth()->user()->canWrite())
                    <form method="post" action="/admin/positions/{{ $item->id }}" data-confirm="ลบตำแหน่งนี้หรือไม่?" data-confirm-title="ลบตำแหน่ง">@csrf @method('delete')<button class="btn ghost">ลบ</button></form>
                @endif
            </div>
        @empty
            <x-empty title="ยังไม่มีตำแหน่ง" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">บุคลากร</h3>
        @forelse($department->people as $item)
            <div class="list-row items-start">
                <div>
                    <div>{{ $item->display_name }}</div>
                    <div class="muted">{{ $item->position?->name ?: 'ไม่มีตำแหน่ง' }}</div>
                    @if($item->description)
                        <div class="muted mt-1">งานที่รับมอบหมาย: {{ $item->description }}</div>
                    @endif
                </div>
                @if(auth()->user()->canWrite())
                    <form method="post" action="/admin/persons/{{ $item->id }}" data-confirm="ลบบุคลากรนี้หรือไม่?" data-confirm-title="ลบบุคลากร">@csrf @method('delete')<button class="btn ghost">ลบ</button></form>
                @endif
            </div>
        @empty
            <x-empty title="ยังไม่มีบุคลากร" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">การเดินหนังสือ</h3>
        @forelse($department->workflows as $item)
            <a href="{{ $item->builderPath() }}" class="list-row">
                <div>
                    <strong>{{ $item->name }}</strong>
                    <div class="muted">{{ $item->lastSavedLabel() }}</div>
                </div>
                <span class="text-sts">→</span>
            </a>
        @empty
            <x-empty title="ยังไม่มีการเดินหนังสือ" text="กดสร้างการเดินหนังสือเพื่อเปิดแผนผัง" />
        @endforelse
    </div>
    <div class="card card-pad">
        <div class="mb-2 flex items-center justify-between gap-3">
            <h3 class="section-title mb-0">ความต้องการของระบบ</h3>
            @if(auth()->user()->canWrite())
                <button class="btn secondary" onclick="document.getElementById('req').showModal()">เพิ่ม</button>
            @endif
        </div>
        @forelse($requirements as $item)
            <div class="list-row">
                <div>
                    <span class="badge">{{ $item->requirement_code }}</span>
                    <div class="mt-1">{{ $item->title }}</div>
                </div>
                <x-status :value="$item->priority" />
            </div>
        @empty
            <x-empty title="ยังไม่มีความต้องการ" />
        @endforelse
    </div>
</div>
<x-dialog id="pos" title="สร้างตำแหน่ง" subtitle="เลือกตำแหน่งมาตรฐาน หรือพิมพ์ชื่อใหม่ แล้วผูกกับบุคลากรในกองนี้">
    <form method="post" action="/admin/organizations/{{ $organization->id }}/departments/{{ $department->id }}/positions">
        @csrf
        <input type="hidden" name="_dialog" value="pos">
        <label>ตำแหน่งมาตรฐาน</label>
        <div class="mb-1 flex flex-wrap gap-1.5">
            @foreach($positionTemplates as $template)
                <button type="button" class="pick-chip" data-fill-name="{{ $template['title'] }}">{{ $template['title'] }}</button>
            @endforeach
        </div>
        <label>ชื่อตำแหน่ง</label>
        <input class="input" name="name" value="{{ old('name') }}" list="pos-template-list" required>
        <datalist id="pos-template-list">
            @foreach($positionTemplates as $template)
                <option value="{{ $template['title'] }}"></option>
            @endforeach
        </datalist>
        <label>รหัส</label>
        <input class="input" name="code" value="{{ old('code') }}" placeholder="ไม่บังคับ">
        <label>หน้าที่ของตำแหน่ง</label>
        <textarea class="input short" name="description" placeholder="เช่น รับ-ส่งหนังสือของกอง, เสนอหัวหน้างาน">{{ old('description') }}</textarea>
        <div class="dialog-actions"><button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button><button class="btn">สร้าง</button></div>
    </form>
</x-dialog>
<x-dialog id="per" title="สร้างบุคลากร" subtitle="เลือกตำแหน่ง ระบุงานที่รับมอบหมาย แล้วลากชื่อไปวางบนแผนผังได้">
    <form method="post" action="/admin/organizations/{{ $organization->id }}/departments/{{ $department->id }}/persons">
        @csrf
        <input type="hidden" name="_dialog" value="per">
        <div class="grid gap-3 sm:grid-cols-2">
            <div><label>ชื่อ</label><input class="input" name="first_name" value="{{ old('first_name') }}" required></div>
            <div><label>นามสกุล</label><input class="input" name="last_name" value="{{ old('last_name') }}" required></div>
        </div>
        <label>ตำแหน่ง</label>
        <select class="input" name="position_id" id="person-position">
            <option value="">ไม่มีตำแหน่ง</option>
            @if($department->positions->isNotEmpty())
                <optgroup label="ตำแหน่งในกองนี้">
                    @foreach($department->positions as $item)
                        <option value="{{ $item->id }}" @selected(old('position_id')===$item->id)>{{ $item->name }}</option>
                    @endforeach
                </optgroup>
            @endif
            @php
                $unusedTemplates = collect($positionTemplates)->filter(
                    fn ($template) => ! $department->positions->contains(fn ($item) => $item->name === $template['title'])
                );
            @endphp
            @if($unusedTemplates->isNotEmpty())
                <optgroup label="ตำแหน่งมาตรฐาน">
                    @foreach($unusedTemplates as $template)
                        <option value="new:{{ $template['title'] }}" @selected(old('position_id')==='new:'.$template['title'])>{{ $template['title'] }}</option>
                    @endforeach
                </optgroup>
            @endif
        </select>
        <label>หรือพิมพ์ตำแหน่งใหม่</label>
        <input class="input" name="position_name" id="person-position-name" value="{{ old('position_name') }}" placeholder="เช่น หัวหน้าฝ่ายแผนงาน" list="per-template-list">
        <datalist id="per-template-list">
            @foreach($positionTemplates as $template)
                <option value="{{ $template['title'] }}"></option>
            @endforeach
        </datalist>
        <label>งานที่รับมอบหมาย</label>
        <textarea class="input short" name="description" placeholder="เช่น รับหนังสือเข้า ลงทะเบียน และส่งต่อหัวหน้างาน">{{ old('description') }}</textarea>
        <div class="dialog-actions"><button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button><button class="btn">สร้าง</button></div>
    </form>
</x-dialog>
<x-dialog id="wf" title="สร้างการเดินหนังสือ" subtitle="เปิดแผนผังเพื่อออกแบบงาน ตำแหน่ง และหน้าที่">
    <form method="post" action="/admin/organizations/{{ $organization->id }}/departments/{{ $department->id }}/workflows">
        @csrf
        <input type="hidden" name="_dialog" value="wf">
        <label>ชื่อการเดินหนังสือ</label>
        <input class="input" name="name" value="{{ old('name') }}" required>
        <label>คำอธิบาย</label>
        <textarea class="input" name="description">{{ old('description') }}</textarea>
        <div class="dialog-actions"><button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button><button class="btn">สร้างและเปิดแผนผัง</button></div>
    </form>
</x-dialog>
<x-dialog id="req" title="เพิ่มความต้องการของระบบ">
    <form method="post" action="/admin/organizations/{{ $organization->id }}/departments/{{ $department->id }}/requirements">
        @csrf
        <input type="hidden" name="_dialog" value="req">
        <label>ชื่อความต้องการ</label>
        <input class="input" name="title" value="{{ old('title') }}" required>
        <label>รหัส</label>
        <input class="input" name="requirement_code" value="{{ old('requirement_code') }}">
        <label>รายละเอียด</label>
        <textarea class="input" name="description">{{ old('description') }}</textarea>
        <label>ความสำคัญ</label>
        <select class="input" name="priority">
            @foreach(['low'=>'ต่ำ','medium'=>'กลาง','high'=>'สูง','critical'=>'วิกฤต'] as $value=>$label)
                <option value="{{ $value }}" @selected(old('priority', 'medium')===$value)>{{ $label }}</option>
            @endforeach
        </select>
        <div class="dialog-actions"><button type="button" class="btn secondary" onclick="this.closest('dialog').close()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>
</x-dialog>
@endsection
