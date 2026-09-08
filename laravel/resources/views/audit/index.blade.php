@extends('layouts.app')
@section('content')
<x-page-head kicker="ความปลอดภัย" title="ประวัติการใช้งาน" text="ติดตามการเข้าสู่ระบบและการแก้ไขข้อมูล" />
<form class="mb-6 flex max-w-md gap-2">
    <input class="input" name="action" value="{{ request('action') }}" placeholder="กรอง action เช่น LOGIN">
    <button class="btn secondary shrink-0">กรอง</button>
</form>
<div class="table-wrap">
    <table class="table">
        <thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>
        @forelse($logs as $item)
            <tr>
                <td class="whitespace-nowrap">{{ optional($item->created_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $item->actor->name ?? '-' }}</td>
                <td><span class="badge">{{ $item->action }}</span></td>
                <td>{{ $item->entity_type }} {{ $item->entity_id }}</td>
            </tr>
        @empty
            <tr><td colspan="4"><x-empty title="ยังไม่มีประวัติ" /></td></tr>
        @endforelse
        </tbody>
    </table>
</div>
{{ $logs->links() }}
@endsection
