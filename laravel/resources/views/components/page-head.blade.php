@props(['kicker' => null, 'title', 'text' => null])
<div {{ $attributes->merge(['class' => 'page-head']) }}>
    <div class="min-w-0">
        @if($kicker)
            <p class="page-kicker">{{ $kicker }}</p>
        @endif
        <h1>{{ $title }}</h1>
        @if($text)
            <p class="muted mt-1">{{ $text }}</p>
        @endif
    </div>
    @if($slot->isNotEmpty())
        <div class="page-head-actions">{{ $slot }}</div>
    @endif
</div>
