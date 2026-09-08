@extends('layouts.app')
@section('content')
<x-page-head title='ผลการค้นหา “{{ $q }}”' text="ค้นจากหน่วยงาน การเดินหนังสือ และความต้องการของระบบ" />
@if(strlen((string) $q) < 2)
    <div class="card"><x-empty title="พิมพ์คำค้นอย่างน้อย 2 ตัวอักษร" text="เช่น ชื่อ อบต. หรือชื่องานเดินหนังสือ" /></div>
@else
<div class="grid gap-4 lg:grid-cols-2">
    <div class="card card-pad">
        <h3 class="section-title">หน่วยงาน</h3>
        @forelse($organizations as $item)
            <a href="/admin/organizations/{{ $item->id }}" class="list-row">{{ $item->name }}</a>
        @empty
            <x-empty title="ไม่พบหน่วยงาน" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">การเดินหนังสือ</h3>
        @forelse($workflows as $item)
            <a href="{{ $item->builderPath() }}" class="list-row">{{ $item->name }}</a>
        @empty
            <x-empty title="ไม่พบการเดินหนังสือ" />
        @endforelse
    </div>
    <div class="card card-pad lg:col-span-2">
        <h3 class="section-title">ความต้องการของระบบ</h3>
        @forelse($requirements as $item)
            <div class="list-row">{{ $item->requirement_code }} · {{ $item->title }}</div>
        @empty
            <x-empty title="ไม่พบความต้องการ" />
        @endforelse
    </div>
</div>
@endif
@endsection
