@extends('layouts.app')
@section('content')
<x-page-head kicker="ภาพรวมระบบ" title="สวัสดี {{ auth()->user()->name }}" text="สรุปหน่วยงาน การเดินหนังสือ และความต้องการของระบบ" />
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <x-stat label="หน่วยงาน" :value="$organizationCount" href="/admin/organizations">
        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21V7l9-4 9 4v14M9 21v-6h6v6"/></svg>
    </x-stat>
    <x-stat label="กอง / สำนัก" :value="$departmentCount" href="/admin/organizations">
        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 21V10m16 11V10M4 10l8-6 8 6M9 21v-6h6v6"/></svg>
    </x-stat>
    <x-stat label="บุคลากร" :value="$personCount" href="/admin/organizations">
        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8"/></svg>
    </x-stat>
    <x-stat label="ความต้องการของระบบ" :value="$requirementCount" href="/admin/requirements">
        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5h12M9 12h12M9 19h12M4 5h.01M4 12h.01M4 19h.01"/></svg>
    </x-stat>
</div>
<div class="mt-6 grid gap-4 lg:grid-cols-2">
    <div class="card card-pad">
        <h3 class="section-title">หน่วยงานล่าสุด</h3>
        @forelse($recentOrganizations as $item)
            <a href="/admin/organizations/{{ $item->id }}" class="list-row">
                <div>
                    <strong>{{ $item->name }}</strong>
                    <div class="muted">{{ $item->type }} · จังหวัด{{ $item->province }}</div>
                </div>
                <span class="text-sts">→</span>
            </a>
        @empty
            <x-empty title="ยังไม่มีหน่วยงาน" text="เริ่มจากเมนูหน่วยงานทางซ้าย" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">การเดินหนังสือล่าสุด</h3>
        @forelse($recentWorkflows as $item)
            <a href="{{ $item->builderPath() }}" class="list-row items-start">
                <div>
                    <strong>{{ $item->name }}</strong>
                    <div class="muted">{{ $item->organization->name ?? '-' }} · {{ $item->department->name ?? '-' }}</div>
                    <div class="muted">{{ $item->lastSavedLabel() }}</div>
                </div>
                <span class="text-sts">→</span>
            </a>
        @empty
            <x-empty title="ยังไม่มีการเดินหนังสือ" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">ความต้องการของระบบล่าสุด</h3>
        @forelse($recentRequirements as $item)
            <div class="list-row">
                <div>
                    <div class="badge">{{ $item->requirement_code }}</div>
                    <div class="mt-1 font-medium text-sts-deep">{{ $item->title }}</div>
                </div>
            </div>
        @empty
            <x-empty title="ยังไม่มีความต้องการ" />
        @endforelse
    </div>
    <div class="card card-pad">
        <h3 class="section-title">กิจกรรมล่าสุด</h3>
        @forelse($recentActivities as $item)
            <div class="list-row">
                <div>
                    <strong>{{ $item->action }}</strong>
                    <div class="muted">{{ $item->actor->name ?? 'ผู้ใช้' }} · {{ optional($item->created_at)->format('d/m/Y H:i') }}</div>
                </div>
            </div>
        @empty
            <x-empty title="ยังไม่มีกิจกรรม" />
        @endforelse
    </div>
</div>
<div class="tile-card mt-4 flex items-center justify-between gap-3 text-sm text-stone-600">
    <span>การเดินหนังสือทั้งหมดในระบบ</span>
    <span class="text-lg font-extrabold text-sts-deep">{{ number_format($workflowCount) }}</span>
</div>
@endsection
