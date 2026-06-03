// Screen-reader announcements via a visually-hidden live region (#sr-announcer).
// Clearing before setting forces assistive tech to re-announce a message even
// when it repeats (e.g. two "Defeated" outcomes in a row).

let region: HTMLElement | null = null;

function el(): HTMLElement | null {
  if (!region) region = document.getElementById('sr-announcer');
  return region;
}

export function announce(message: string): void {
  const r = el();
  if (!r) return;
  r.textContent = '';
  window.setTimeout(() => {
    if (r) r.textContent = message;
  }, 40);
}
