@props(['label', 'value', 'href' => null])
@if($href)
<a href="{{ $href }}" {{ $attributes->merge(['class' => 'stat-card']) }}>
@else
<div {{ $attributes->merge(['class' => 'stat-card']) }}>
@endif
    <div class="stat-icon">{{ $slot }}</div>
    <div class="min-w-0">
        <div class="muted">{{ $label }}</div>
        <div class="stat-value">{{ is_numeric($value) ? number_format($value) : $value }}</div>
    </div>
@if($href)
</a>
@else
</div>
@endif
