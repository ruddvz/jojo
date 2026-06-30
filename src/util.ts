// iOS-safe file + clipboard helpers (docs/02, docs/07).

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

let lastBlobUrl: string | null = null;

// Reserve a blank tab SYNCHRONOUSLY inside the tap handler. iOS Safari blocks
// window.open() called after an await, so we open the tab first and only set
// its URL once the (async) PDF is ready. Returns null if the popup was blocked.
export function reservePdfTab(): Window | null {
  const win = window.open('', '_blank');
  if (win) {
    try {
      win.document.write(
        '<!doctype html><title>Résumé…</title><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<body style="margin:0;font:16px -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#666">Generating résumé…</body>'
      );
    } catch {
      /* cross-origin guard; ignore */
    }
  }
  return win;
}

// Point the reserved tab at the generated PDF (blob URL is iOS-savable; data: is not).
// Falls back to a fresh open + a download anchor for desktop/Android.
export function openPdf(bytes: Uint8Array, filename: string, win?: Window | null): void {
  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  lastBlobUrl = url;

  if (win && !win.closed) {
    win.location.href = url;
  } else {
    window.open(url, '_blank');
  }

  // Best-effort download for desktop / Android (ignored by iOS Safari).
  const a = el('a', { href: url, download: filename });
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function closeTab(win?: Window | null): void {
  if (win && !win.closed) {
    try {
      win.close();
    } catch {
      /* ignore */
    }
  }
}

export function downloadText(text: string, filename: string, type = 'application/json'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without Clipboard API permission.
    try {
      const ta = el('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Styled confirm dialog (iOS-alert feel) — resolves true/false.
export function confirmDialog(opts: {
  title: string;
  message?: string;
  confirm?: string;
  cancel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const scrim = el('div', { class: 'confirm-scrim' });
    const card = el('div', { class: 'confirm-card' });
    card.innerHTML = `
      <div class="confirm-title">${escapeHtml(opts.title)}</div>
      ${opts.message ? `<div class="confirm-msg">${escapeHtml(opts.message)}</div>` : ''}
      <div class="confirm-actions">
        <button class="confirm-btn cancel">${escapeHtml(opts.cancel || 'Cancel')}</button>
        <button class="confirm-btn go ${opts.danger ? 'danger' : ''}">${escapeHtml(
          opts.confirm || 'Confirm'
        )}</button>
      </div>`;
    scrim.append(card);
    document.body.append(scrim);
    requestAnimationFrame(() => scrim.classList.add('open'));

    const close = (result: boolean) => {
      scrim.classList.remove('open');
      setTimeout(() => scrim.remove(), 220);
      resolve(result);
    };
    card.querySelector('.cancel')!.addEventListener('click', () => close(false));
    card.querySelector('.go')!.addEventListener('click', () => close(true));
    scrim.addEventListener('click', (e) => {
      if (e.target === scrim) close(false);
    });
  });
}

let toastTimer: number | undefined;
export function toast(msg: string): void {
  let t = document.getElementById('toast');
  if (!t) {
    t = el('div', { id: 'toast' });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t!.classList.remove('show'), 1800);
}
