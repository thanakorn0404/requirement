@extends('layouts.app')
@section('content')
<x-page-head kicker="Requirement" title="ความต้องการของระบบทั้งหมด" text="รายการที่ผูกกับการเดินหนังสือของหน่วยงาน" />
<form class="mb-6 flex max-w-lg gap-2">
    <input class="input" name="search" value="{{ request('search') }}" placeholder="ค้นหารหัสหรือชื่อ">
    <button class="btn secondary shrink-0">ค้นหา</button>
</form>
<div class="table-wrap">
    <table class="table">
        <thead><tr><th>รหัส</th><th>ความต้องการของระบบ</th><th>ผู้รับผิดชอบ</th><th>ความสำคัญ</th><th>สถานะ</th></tr></thead>
        <tbody>
        @forelse($requirements as $item)
            <tr>
                <td class="font-semibold text-sts-deep">{{ $item->requirement_code }}</td>
                <td>{{ $item->title }}</td>
                <td>{{ $item->person->display_name ?? '-' }}</td>
                <td><x-status :value="$item->priority" /></td>
                <td><x-status :value="$item->status" /></td>
            </tr>
        @empty
            <tr><td colspan="5"><x-empty title="ไม่พบความต้องการ" /></td></tr>
        @endforelse
        </tbody>
    </table>
</div>
{{ $requirements->links() }}
@endsection
