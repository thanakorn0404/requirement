@props(['title', 'text' => null])
<div {{ $attributes->merge(['class' => 'empty-state']) }}>
    <div class="empty-icon">STS</div>
    <p class="font-semibold text-sts-deep">{{ $title }}</p>
    @if($text)
        <p class="muted mt-1">{{ $text }}</p>
    @endif
    <div class="mt-3">{{ $slot }}</div>
</div>
