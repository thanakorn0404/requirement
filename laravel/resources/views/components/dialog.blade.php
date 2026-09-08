@props(['id', 'title', 'subtitle' => null])
<dialog {{ $attributes->merge(['id' => $id, 'class' => 'ui-dialog']) }}>
    <div class="dialog-head">
        <div>
            <h3>{{ $title }}</h3>
            @if($subtitle)
                <p class="muted mt-1">{{ $subtitle }}</p>
            @endif
        </div>
        <button type="button" class="icon-btn" onclick="this.closest('dialog').close()" aria-label="ปิด">✕</button>
    </div>
    {{ $slot }}
</dialog>
