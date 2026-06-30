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

// Open a generated PDF reliably on iOS Safari: blob URL in a new tab + best-effort download.
export function openPdf(bytes: Uint8Array, filename: string): void {
  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  lastBlobUrl = url;

  // New tab (works on iOS where data: URLs cannot be saved).
  const win = window.open(url, '_blank');

  // Best-effort download for desktop / Android.
  const a = el('a', { href: url, download: filename });
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();

  if (!win) {
    // Popup blocked: keep the URL reachable via the same anchor (already clicked).
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
