import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon, sfxType, sfxTypo } from './audio';
import { announce } from './a11y';
import { EVENT_MS_PER_CHAR, resolveEvent, type StoryEvent } from './events';
import type { PlayerStats } from './state';

export interface EventScreenProps {
  event: StoryEvent;
  player: PlayerStats;
  onDone: () => void;
}

export function mountEventScreen(host: HTMLElement, props: EventScreenProps): () => void {
  const { event, player, onDone } = props;

  host.innerHTML = `
    <div class="scene story-event accent-${event.accent}">
      <h2 class="event-title with-drop-cap" data-i18n="${event.titleKey}"></h2>
      <p class="event-flavor" data-i18n="${event.flavorKey}"></p>
      <div class="event-litany">
        <span class="typed"></span><span class="cursor"></span><span class="rest"></span>
      </div>
      <div class="event-timer"><div class="event-timer-fill"></div></div>
      <p class="event-prompt" data-i18n="event_prompt"></p>
      <div class="event-result" data-result hidden></div>
      <button class="reroll-button event-skip" type="button" data-i18n="event_skip"></button>
    </div>
  `;

  const root = host.querySelector('.story-event') as HTMLElement;
  const els = {
    litany: root.querySelector('.event-litany') as HTMLElement,
    typed: root.querySelector('.event-litany .typed') as HTMLElement,
    cursor: root.querySelector('.event-litany .cursor') as HTMLElement,
    rest: root.querySelector('.event-litany .rest') as HTMLElement,
    timerFill: root.querySelector('.event-timer-fill') as HTMLElement,
    prompt: root.querySelector('.event-prompt') as HTMLElement,
    result: root.querySelector('[data-result]') as HTMLElement,
    skip: root.querySelector('.event-skip') as HTMLButtonElement,
  };

  let litany = t(event.litanyKey);
  let typed = '';
  let mistakes = 0;
  let startedAt = 0;
  let budgetMs = litany.length * EVENT_MS_PER_CHAR;
  let resolved = false;
  let rafHandle: number | null = null;

  function renderLitany() {
    const i = typed.length;
    els.typed.textContent = litany.slice(0, i);
    els.cursor.textContent = litany[i] ?? '';
    els.rest.textContent = litany.slice(i + 1);
  }

  function loop() {
    if (!resolved && startedAt > 0) {
      const elapsed = performance.now() - startedAt;
      const frac = Math.min(1, elapsed / budgetMs);
      els.timerFill.style.width = `${(1 - frac) * 100}%`;
      if (frac >= 1) {
        // Time ran out — the litany fades into a faint blessing.
        finish(true, false);
        return;
      }
    }
    rafHandle = requestAnimationFrame(loop);
  }

  function finish(completed: boolean, flawless: boolean) {
    if (resolved) return;
    resolved = true;
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    document.removeEventListener('keydown', onKey);
    els.skip.disabled = true;
    const reward = resolveEvent(player, event.id, { completed, flawless });
    const titleKey =
      reward.outcome === 'blessing'
        ? 'event_blessing'
        : reward.outcome === 'faint'
          ? 'event_faint'
          : 'event_passed';
    const parts: string[] = [t(titleKey)];
    if (reward.healed > 0) parts.push(t('encounter_healed', { n: reward.healed }));
    if (reward.buffKey) parts.push(t(reward.buffKey));
    els.result.hidden = false;
    els.result.dataset.outcome = reward.outcome;
    renderTextWithDropCap(els.result, parts.join(' · '));
    announce(parts.join('. '));
    if (reward.outcome === 'blessing') sfxBoon();
    window.setTimeout(onDone, 1500);
  }

  function onKey(e: KeyboardEvent) {
    if (resolved) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Backspace') {
      if (typed.length > 0) {
        typed = typed.slice(0, -1);
        renderLitany();
      }
      e.preventDefault();
      return;
    }
    if (e.key.length !== 1) return;
    const expected = litany[typed.length];
    if (!expected) return;
    e.preventDefault();
    if (startedAt === 0) startedAt = performance.now();
    if (e.key.toLowerCase() === expected.toLowerCase()) {
      typed += expected;
      sfxType();
      renderLitany();
      if (typed.length === litany.length) {
        const elapsed = performance.now() - startedAt;
        finish(true, mistakes === 0 && elapsed <= budgetMs);
      }
    } else {
      mistakes += 1;
      sfxTypo();
    }
  }

  function applyI18n() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n!);
      if (el.classList.contains('with-drop-cap')) {
        renderTextWithDropCap(el, text);
      } else {
        el.textContent = text;
      }
    });
  }

  const offLocale = onLocaleChange(() => {
    applyI18n();
    if (!resolved) {
      // The litany text changed languages — restart the recitation cleanly.
      litany = t(event.litanyKey);
      typed = '';
      mistakes = 0;
      startedAt = 0;
      budgetMs = litany.length * EVENT_MS_PER_CHAR;
      els.timerFill.style.width = '100%';
      renderLitany();
    }
  });

  applyI18n();
  renderLitany();
  els.timerFill.style.width = '100%';
  els.skip.addEventListener('click', () => finish(false, false));
  document.addEventListener('keydown', onKey);
  loop();

  return () => {
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    document.removeEventListener('keydown', onKey);
    offLocale();
  };
}
