@if ($paginator->hasPages())
<nav class="pager" role="navigation" aria-label="หน้าถัดไป">
    <p class="muted">
        แสดง
        <span class="font-semibold text-sts-deep">{{ number_format($paginator->firstItem() ?: 0) }}</span>
        –
        <span class="font-semibold text-sts-deep">{{ number_format($paginator->lastItem() ?: 0) }}</span>
        จาก
        <span class="font-semibold text-sts-deep">{{ number_format($paginator->total()) }}</span>
        รายการ
    </p>
    <div class="flex flex-wrap items-center gap-1">
        @if ($paginator->onFirstPage())
            <span class="pager-btn is-disabled">ก่อนหน้า</span>
        @else
            <a href="{{ $paginator->previousPageUrl() }}" class="pager-btn">ก่อนหน้า</a>
        @endif

        @foreach ($elements as $element)
            @if (is_string($element))
                <span class="pager-btn is-disabled">{{ $element }}</span>
            @endif
            @if (is_array($element))
                @foreach ($element as $page => $url)
                    @if ($page == $paginator->currentPage())
                        <span class="pager-btn is-active">{{ $page }}</span>
                    @else
                        <a href="{{ $url }}" class="pager-btn">{{ $page }}</a>
                    @endif
                @endforeach
            @endif
        @endforeach

        @if ($paginator->hasMorePages())
            <a href="{{ $paginator->nextPageUrl() }}" class="pager-btn">ถัดไป</a>
        @else
            <span class="pager-btn is-disabled">ถัดไป</span>
        @endif
    </div>
</nav>
@endif
