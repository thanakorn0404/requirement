<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>แผนผังการเดินหนังสือ {{ $department->name }} {{ $workflow->name }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="{{ asset('css/workflow-nodes.css') }}?v={{ filemtime(public_path('css/workflow-nodes.css')) }}">
    @php
        $printedAt = now('Asia/Bangkok');
        $printedDate = $printedAt->format('d/m/').($printedAt->year + 543);
        $printedTime = $printedAt->format('H:i');
        $savedAt = $workflow->updated_at?->timezone('Asia/Bangkok');
        $savedLabel = $savedAt
            ? $savedAt->format('d/m/').($savedAt->year + 543).' เวลา '.$savedAt->format('H:i').' น.'
            : 'ยังไม่บันทึก';
        $place = collect([$organization->subdistrict, $organization->district, $organization->province])->filter()->implode(' ');
    @endphp
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body.print-flow {
            margin: 0;
            background: #f6f4f5;
            color: #3f0d12;
            font-family: "Noto Sans Thai", sans-serif;
        }
        .print-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 24px;
            background: #fff;
            border-bottom: 1px solid #edd6da;
        }
        .print-page {
            padding: 16px 24px 24px;
        }
        .doc-sheet {
            background: #fff;
            border: 1px solid #edd6da;
            overflow: hidden;
        }
        .doc-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 18px 12px;
            border-bottom: 3px solid #e11d2e;
        }
        .doc-brand {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            min-width: 0;
        }
        .doc-mark {
            display: grid;
            place-items: center;
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            border-radius: 10px;
            background: #e11d2e;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
        }
        .doc-kicker {
            margin: 0;
            color: #be123c;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
        }
        .doc-title {
            margin: 2px 0 0;
            font-size: 18px;
            font-weight: 800;
            line-height: 1.45;
        }
        .doc-sub {
            margin: 2px 0 0;
            color: #57534e;
            font-size: 12px;
        }
        .doc-meta {
            flex-shrink: 0;
            text-align: right;
        }
        .doc-badge {
            display: inline-block;
            margin-bottom: 6px;
            padding: 3px 8px;
            border: 1px solid #e11d2e;
            border-radius: 999px;
            color: #e11d2e;
            font-size: 11px;
            font-weight: 700;
        }
        .doc-meta p {
            margin: 0;
            color: #57534e;
            font-size: 11px;
            line-height: 1.7;
        }
        .doc-note {
            padding: 8px 18px;
            background: #fff8f8;
            border-bottom: 1px solid #f1d5d9;
            color: #7f1d1d;
            font-size: 12px;
        }
        .doc-body {
            padding: 12px 18px 8px;
        }
        .doc-foot {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 8px;
            padding: 8px 18px 10px;
            border-top: 1px solid #edd6da;
            color: #78716c;
            font-size: 11px;
        }
        body.print-flow .print-stage {
            position: relative;
            width: 100%;
        }
        body.print-flow .canvas {
            min-width: 0 !important;
            min-height: 0 !important;
            width: auto;
            height: auto;
            background: #fff;
        }
        body.print-flow .canvas .wf-node { cursor: default; }
        body.print-flow .canvas .wf-node .handle {
            pointer-events: none;
            cursor: default;
            box-shadow: none;
        }
        body.print-flow .canvas .wf-node .handle::after { display: none; }
        body.print-flow .canvas .wf-edge-hit,
        body.print-flow .canvas .wf-edge-del { display: none; }
        body.print-flow .canvas .edge-layer {
            width: 100% !important;
            height: 100% !important;
        }
        .print-diagram-wrap { width: 100%; }
        .print-diagram {
            display: block;
            width: auto;
            max-width: 100%;
            height: auto;
            max-height: 148mm;
        }
        .print-empty {
            padding: 48px 24px;
            text-align: center;
            color: #78716c;
        }
        @media print {
            html, body.print-flow {
                background: #fff !important;
                overflow: hidden !important;
            }
            .print-toolbar,
            .btn { display: none !important; }
            .print-page { padding: 0; }
            .doc-sheet { border: 0; }
            .print-diagram {
                max-width: 277mm;
                max-height: 142mm;
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body class="print-flow">
<div class="print-toolbar">
    <div>
        <h1 style="margin:0;font-size:22px;font-weight:800;">พิมพ์แผนผังส่งหน่วยงาน</h1>
        <p class="muted" style="margin:4px 0 0;">ตรวจหัวกระดาษแล้วกดพิมพ์ · เลือก Save as PDF และปิด Headers and footers</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
        <a class="btn secondary" href="{{ $workflow->builderPath() }}">กลับไปแก้ไข</a>
        <button class="btn" type="button" id="btn-print-pdf">พิมพ์ / บันทึก PDF</button>
    </div>
</div>
<div class="print-page">
    <div class="doc-sheet">
        <div class="doc-head">
            <div class="doc-brand">
                <div class="doc-mark">STS</div>
                <div>
                    <p class="doc-kicker">แผนผังการเดินหนังสือ</p>
                    <h1 class="doc-title">{{ $workflow->name }}</h1>
                    <p class="doc-sub">{{ $organization->name }} · {{ $department->name }}@if($place) · {{ $place }}@endif</p>
                </div>
            </div>
            <div class="doc-meta">
                <span class="doc-badge">สำหรับหน่วยงานพิจารณา</span>
                <p>วันที่พิมพ์ {{ $printedDate }} เวลา {{ $printedTime }} น.</p>
                <p>บันทึกล่าสุด {{ $savedLabel }}</p>
                @if($workflow->current_version)
                    <p>เวอร์ชัน {{ $workflow->current_version }}</p>
                @endif
            </div>
        </div>
        <div class="doc-note">เอกสารนี้จัดทำเพื่อให้หน่วยงานพิจารณาขั้นตอนการเดินหนังสือ โปรดตรวจจากต้นฉบับในระบบ หากมีการปรับปรุง ให้พิมพ์ใหม่จากระบบ</div>
        <div class="doc-body">
            @if(count($graph['blocks'] ?? []) === 0)
                <div class="print-empty">ยังไม่มีบล็อคในแผนผังนี้</div>
            @else
                <div id="print-stage">
                    <div class="canvas" id="canvas">
                        <svg class="edge-layer" id="edges"></svg>
                    </div>
                </div>
            @endif
        </div>
        <div class="doc-foot">
            <span>STS BBS · ระบบจัดเก็บ Requirement สารบรรณ</span>
            <span>ส่งให้หน่วยงานดูเท่านั้น · ไม่ใช่ต้นฉบับสำหรับแก้ไข</span>
        </div>
    </div>
</div>
<script>
window.WORKFLOW = {
  canWrite: false,
  printMode: true,
  csrf: "",
  id: @json($workflow->id),
  blocks: @json($graph['blocks']),
  edges: @json($graph['edges']),
};
</script>
@if(count($graph['blocks'] ?? []) > 0)
<script src="{{ asset('js/workflow-builder.js') }}?v={{ filemtime(public_path('js/workflow-builder.js')) }}"></script>
@endif
</body>
</html>
