<dialog id="confirm-dialog" class="ui-dialog confirm-dialog">
    <button type="button" class="icon-btn confirm-dialog-close" data-confirm-cancel aria-label="ปิด">✕</button>
    <div class="confirm-dialog-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
        </svg>
    </div>
    <h3 id="confirm-title">ยืนยันการทำงาน</h3>
    <p id="confirm-message"></p>
    <div class="confirm-dialog-actions">
        <button type="button" class="btn secondary" data-confirm-cancel>ยกเลิก</button>
        <button type="button" class="btn danger" id="confirm-ok">ยืนยัน</button>
    </div>
</dialog>
<div id="toast" class="toast" hidden></div>
