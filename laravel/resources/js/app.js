import './bootstrap';

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function closeSidebar() {
    sidebar?.classList.add('-translate-x-full');
    overlay?.classList.add('hidden');
}

function openSidebar() {
    sidebar?.classList.remove('-translate-x-full');
    overlay?.classList.remove('hidden');
}

document.getElementById('sidebar-toggle')?.addEventListener('click', openSidebar);
overlay?.addEventListener('click', closeSidebar);
document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);

window.stsToast = function stsToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(window.__stsToastTimer);
    window.__stsToastTimer = setTimeout(() => {
        toast.hidden = true;
    }, 2400);
};

window.stsConfirm = function stsConfirm(message, title = 'ยืนยันการทำงาน') {
    const dialog = document.getElementById('confirm-dialog');
    if (!dialog) return Promise.resolve(window.confirm(message));

    return new Promise((resolve) => {
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const ok = document.getElementById('confirm-ok');
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        dialog.dataset.answer = '';

        const onClose = () => resolve(dialog.dataset.answer === 'yes');
        dialog.querySelectorAll('[data-confirm-cancel]').forEach((btn) => {
            btn.onclick = () => {
                dialog.dataset.answer = 'no';
                dialog.close();
            };
        });
        if (ok) {
            ok.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                dialog.dataset.answer = 'yes';
                dialog.close();
            };
        }
        dialog.addEventListener('close', onClose, { once: true });
        dialog.showModal();
        ok?.focus();
    });
};

document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-confirm]');
    if (!form || form.dataset.confirmed === '1') return;
    event.preventDefault();
    const ok = await window.stsConfirm(form.dataset.confirm, form.dataset.confirmTitle || 'ยืนยันการทำงาน');
    if (!ok) return;
    form.dataset.confirmed = '1';
    form.submit();
});

document.querySelectorAll('dialog.ui-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
});

const reopenId = document.body?.dataset?.reopenDialog;
if (reopenId) {
    document.getElementById(reopenId)?.showModal();
}

document.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-fill-name]');
    if (!chip) return;
    const form = chip.closest('form');
    const input = form?.querySelector('[name="name"]');
    if (!input) return;
    input.value = chip.dataset.fillName;
    input.focus();
});

document.getElementById('person-position')?.addEventListener('change', function () {
    const custom = this.form?.querySelector('[name="position_name"]');
    if (custom && this.value) custom.value = '';
});
