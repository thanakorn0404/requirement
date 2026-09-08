@props(['value'])
@php
    $maps = [
        'draft' => ['ร่าง', 'bg-stone-100 text-stone-700'],
        'review' => ['รอตรวจ', 'bg-amber-50 text-amber-800'],
        'active' => ['ใช้งาน', 'bg-emerald-50 text-emerald-800'],
        'deleted' => ['ลบแล้ว', 'bg-rose-50 text-rose-800'],
        'low' => ['ต่ำ', 'bg-stone-100 text-stone-600'],
        'medium' => ['กลาง', 'bg-sky-50 text-sky-800'],
        'high' => ['สูง', 'bg-orange-50 text-orange-800'],
        'critical' => ['วิกฤต', 'bg-rose-50 text-rose-800'],
        'ADMIN' => ['ผู้ดูแลระบบ', 'bg-sts-soft text-sts-deep'],
        'EDITOR' => ['ผู้แก้ไข', 'bg-indigo-50 text-indigo-800'],
        'VIEWER' => ['ผู้ดู', 'bg-stone-100 text-stone-700'],
    ];
    $hit = $maps[$value] ?? $maps[strtolower((string) $value)] ?? [($value ?: '-'), 'bg-sts-soft text-sts-deep'];
@endphp
<span {{ $attributes->merge(['class' => 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold '.$hit[1]]) }}>{{ $hit[0] }}</span>
