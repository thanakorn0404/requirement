@extends('layouts.app')
@section('content')
<x-page-head kicker="ภาพรวมระบบ" title="สวัสดี {{ auth()->user()->name }}" text="สรุปหน่วยงาน การเดินหนังสือ และความต้องการของระบบ" />
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    @foreach([
        ['หน่วยงาน', $organizationCount, '/admin/organizations'],
        ['กอง / สำนัก', $departmentCount, '/admin/organizations'],
        ['บุคลากร', $personCount, '/admin/organizations'],
        ['ความต้องการของระบบ', $requirementCount, '/admin/requirements'],
    ] as $card)
    <a class="stat-card" href="{{ $card[2] }}">
        <div class="muted">{{ $card[0] }}</div>
        <div class="stat-value">{{ number_format($card[1]) }}</div>
        <div class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sts/10"></div>
    </a>
    @endforeach
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
<div class="card card-pad mt-4 flex items-center justify-between gap-3 text-sm text-stone-600">
    <span>การเดินหนังสือทั้งหมดในระบบ</span>
    <span class="text-lg font-extrabold text-sts-deep">{{ number_format($workflowCount) }}</span>
</div>
@endsection
