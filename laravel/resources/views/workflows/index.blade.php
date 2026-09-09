@extends('layouts.app')
@section('content')
<x-page-head kicker="แผนผังงาน" title="การเดินหนังสือทั้งหมด" text="เปิดแผนผังเพื่อออกแบบงาน ตำแหน่ง และหน้าที่" />
<div class="grid gap-4">
@forelse($workflows as $item)
    <a class="tile-card" href="{{ $item->builderPath() }}">
        <div class="flex items-start justify-between gap-3">
            <strong class="text-lg text-sts-deep">{{ $item->name }}</strong>
            <x-status :value="$item->status" />
        </div>
        <div class="muted mt-2">{{ $item->organization->name ?? '' }} · {{ $item->department->name ?? '' }}</div>
        <div class="muted">{{ $item->lastSavedLabel() }}</div>
    </a>
@empty
    <div class="card"><x-empty title="ยังไม่มีการเดินหนังสือ" text="สร้างจากหน้ากอง / สำนัก" /></div>
@endforelse
</div>
@endsection
