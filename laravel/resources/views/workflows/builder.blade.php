<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $workflow->name }} · STS BBS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="{{ asset('css/workflow-nodes.css') }}?v={{ filemtime(public_path('css/workflow-nodes.css')) }}">
</head>
<body class="overflow-hidden">
@php $canWrite = auth()->user()->canWrite(); @endphp
<div class="builder">
    <div class="h-1 bg-linear-to-r from-sts via-sts-dark to-sts-navy"></div>
    <header class="builder-head">
        <div>
            <a class="back-link mb-0 hover:text-sts" href="/admin/organizations/{{ $organization->id }}/departments/{{ $department->id }}">← กลับไปกอง</a>
            <h1 class="mt-1 text-xl">{{ $department->name }}</h1>
            <div class="muted">{{ $workflow->name }}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <span class="badge" id="save-state">{{ $workflow->lastSavedLabel() }}</span>
            @if($canWrite)
                <button class="btn secondary" id="btn-share">ลิงก์ให้คนดู</button>
                <button class="btn secondary" type="button" onclick="addBlock()">+ เพิ่มบล็อค</button>
                <button class="btn" id="btn-save">บันทึกการเดินหนังสือ</button>
            @endif
            <a class="btn secondary" href="{{ $workflow->builderPath() }}/print" target="_blank">พิมพ์</a>
        </div>
    </header>
    <div class="builder-body">
        <aside class="builder-side border-b border-rose-100 lg:border-b-0 lg:border-r">
            <p class="mb-1 font-semibold text-sts-deep">บล็อคตำแหน่ง</p>
            <p class="muted mb-3">กดค้างแล้วลากลงแผนผัง หรือคลิกเพื่อวาง</p>
            @foreach($positionTemplates as $template)
                <div class="palette-item" data-position="{{ json_encode($template, JSON_UNESCAPED_UNICODE) }}">
                    <span class="text-stone-300" aria-hidden="true">⋮⋮</span>
                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sts-soft text-[10px] font-bold text-sts">ตำแหน่ง</span>
                    <span>{{ $template['title'] }}</span>
                </div>
            @endforeach
            <p class="mb-1 mt-6 font-semibold text-sts-deep">บุคลากร</p>
            <p class="muted mb-3">ลากชื่อไปวางในบล็อคตำแหน่ง</p>
            @forelse($persons as $person)
                <div class="person-item items-start" data-person="{{ json_encode(['id' => $person->id, 'displayName' => $person->display_name, 'position' => $person->position?->name, 'assignment' => $person->description], JSON_UNESCAPED_UNICODE) }}">
                    <span class="text-stone-300" aria-hidden="true">⋮⋮</span>
                    <span class="min-w-0">
                        <span class="block">{{ $person->display_name }}</span>
                        @if($person->position?->name)
                            <span class="muted block font-normal">{{ $person->position->name }}</span>
                        @endif
                        @if($person->description)
                            <span class="muted block font-normal">{{ $person->description }}</span>
                        @endif
                    </span>
                </div>
            @empty
                <x-empty title="ยังไม่มีบุคลากร" text="เพิ่มจากหน้ากองก่อน แล้วค่อยลากมาวางในบล็อค" />
            @endforelse
        </aside>
        <div class="canvas-wrap" id="canvas-wrap">
            <div class="canvas" id="canvas">
                <svg class="edge-layer" id="edges"></svg>
            </div>
        </div>
        <aside class="builder-side border-t border-rose-100 lg:border-t-0 lg:border-l" id="props">
            <p class="muted">เลือก Block เพื่อแก้ไขรายละเอียด</p>
        </aside>
    </div>
</div>

<x-dialog id="versions" title="เวอร์ชันการเดินหนังสือ" subtitle="เรียกคืนได้เฉพาะผู้ดูแลระบบ และจะสร้างเวอร์ชันใหม่">
    @forelse($workflow->versions as $version)
        <form method="post" action="/admin/workflows/{{ $workflow->id }}/restore/{{ $version->version }}" class="list-row" data-confirm="เรียกคืนเวอร์ชัน {{ $version->version }} และสร้างเวอร์ชันใหม่หรือไม่?" data-confirm-title="เรียกคืนเวอร์ชัน">
            @csrf
            <div>
                <div class="font-semibold">Version {{ $version->version }}</div>
                <div class="muted">{{ optional($version->created_at)->format('d/m/Y H:i') }}</div>
            </div>
            @if(auth()->user()->isAdmin())
                <button class="btn secondary">เรียกคืน</button>
            @endif
        </form>
    @empty
        <x-empty title="ยังไม่มีเวอร์ชัน" text="กดบันทึกการเดินหนังสือเพื่อสร้างเวอร์ชันแรก" />
    @endforelse
</x-dialog>

<x-dialog id="add-block" title="เพิ่มบล็อคตำแหน่ง" subtitle="เลือกตำแหน่งแล้ววางลงแผนผัง">
    <form id="add-block-form">
        <label>ตำแหน่ง</label>
        <select class="input" id="add-block-title" required>
            <option value="">เลือกตำแหน่ง</option>
            @foreach($positionTemplates as $template)
                <option value="{{ $template['title'] }}">{{ $template['title'] }}</option>
            @endforeach
        </select>
        <label>รายละเอียด</label>
        <textarea class="input" id="add-block-desc" placeholder="อธิบายหน้าที่ (ไม่บังคับ)"></textarea>
        <div class="dialog-actions">
            <button type="button" class="btn secondary" onclick="document.getElementById('add-block').close()">ยกเลิก</button>
            <button class="btn">เพิ่มบนแผนผัง</button>
        </div>
    </form>
</x-dialog>

<x-dialog id="share-dialog" title="ลิงก์สำหรับคนดู" subtitle="ผู้ที่ได้รับลิงก์จะเปิดแผนผังได้แบบดูอย่างเดียว">
    <label>ลิงก์แชร์</label>
    <input class="input" id="share-url" readonly>
    <div class="dialog-actions">
        <button type="button" class="btn secondary" onclick="document.getElementById('share-dialog').close()">ปิด</button>
        <button type="button" class="btn" id="copy-share">คัดลอกลิงก์</button>
    </div>
</x-dialog>

<x-overlays />
<script>
window.WORKFLOW = {
  id: @json($workflow->id),
  canWrite: @json($canWrite),
  csrf: document.querySelector('meta[name="csrf-token"]').content,
  blocks: @json($graph['blocks']),
  edges: @json($graph['edges']),
  persons: @json($personOptions),
  positionTemplates: @json($positionTemplates),
};
</script>
<script src="{{ asset('js/workflow-builder.js') }}?v={{ filemtime(public_path('js/workflow-builder.js')) }}"></script>
</body>
</html>
