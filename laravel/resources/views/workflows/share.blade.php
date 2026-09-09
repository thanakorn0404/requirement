<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $workflow->name }} · แชร์การเดินหนังสือ</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="{{ asset('css/workflow-nodes.css') }}?v={{ filemtime(public_path('css/workflow-nodes.css')) }}">
</head>
<body class="overflow-hidden">
<div class="builder">
    <div class="h-1 bg-linear-to-r from-sts via-sts-dark to-sts-navy"></div>
    <header class="builder-head">
        <div>
            <span class="badge" id="live-state">ดูอย่างเดียว · อัปเดตสด</span>
            <h1 class="mt-2 text-xl" id="share-title">{{ $workflow->department->name ?? '' }}</h1>
            <div class="muted" id="share-sub">{{ $workflow->organization->name ?? '' }} · {{ $workflow->name }}</div>
        </div>
    </header>
    <div class="canvas-wrap flex-1" id="canvas-wrap">
        <div class="canvas" id="canvas">
            <svg class="edge-layer" id="edges"></svg>
        </div>
    </div>
</div>
<script>
window.WORKFLOW = {
  canWrite: false,
  csrf: "",
  id: @json($workflow->id),
  liveUrl: @json('/share/workflow/'.$workflow->share_token.'/live'),
  revision: @json($revision),
  blocks: @json($graph['blocks']),
  edges: @json($graph['edges']),
};
</script>
<script src="{{ asset('js/workflow-builder.js') }}?v={{ filemtime(public_path('js/workflow-builder.js')) }}"></script>
</body>
</html>
