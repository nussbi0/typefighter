import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon, sfxHurt, sfxType, sfxTypo } from './audio';
import { announce } from './a11y';
import { EVENT_MS_PER_CHAR, RITE_MIN_ACCURACY, resolveRite, type StoryEvent } from './events';
import { findCharm } from './charms';
import type { PlayerStats } from './state';

export interface EventScreenProps {
  event: StoryEvent;
  player: PlayerStats;
  // Called when the interlude ends; charmId is the charm gained/suffered, or
  // null if the player walked on.
  onDone: (charmId: string | null) => void;
}

export function mountEventScreen(host: HTMLElement, props: EventScreenProps): () => void {
  const { event, player, onDone } = props;

  host.innerHTML = `
    <div class="scene story-event accent-${event.accent}">
      <h2 class="event-title with-drop-cap" data-i18n="${event.titleKey}"></h2>
      <p class="event-flavor" data-i18n="${event.flavorKey}"></p>

      <div class="event-choice" data-choice>
        <button class="begin-fight event-perform" type="button" data-i18n="event_perform"></button>
        <button class="reroll-button event-walk" type="button" data-i18n="event_walk"></button>
        <p class="event-warning" data-i18n="event_warning"></p>
      </div>

      <div class="event-rite" data-rite hidden>
        <div class="event-litany">
          <span class="typed"></span><span class="cursor"></span><span class="rest"></span>
        </div>
        <div class="event-timer"><div class="event-timer-fill"></div></div>
        <p class="event-prompt" data-i18n="event_prompt"></p>
      </div>

      <div class="event-result" data-result hidden></div>
    </div>
  `;

  const root = host.querySelector('.story-event') as HTMLElement;
  const els = {
    choice: root.querySelector('[data-choice]') as HTMLElement,
    perform: root.querySelector('.event-perform') as HTMLButtonElement,
    walk: root.querySelector('.event-walk') as HTMLButtonElement,
    rite: root.querySelector('[data-rite]') as HTMLElement,
    typed: root.querySelector('.event-litany .typed') as HTMLElement,
    cursor: root.querySelector('.event-litany .cursor') as HTMLElement,
    rest: root.querySelector('.event-litany .rest') as HTMLElement,
    timerFill: root.querySelector('.event-timer-fill') as HTMLElement,
    result: root.querySelector('[data-result]') as HTMLElement,
  };

  let litany = t(event.litanyKey);
  let typed = '';
  let correct = 0;
  let mistakes = 0;
  let startedAt = 0;
  let budgetMs = litany.length * EVENT_MS_PER_CHAR;
  let phase: 'choice' | 'rite' | 'done' = 'choice';
  let rafHandle: number | null = null;

  function renderLitany() {
    const i = typed.length;
    els.typed.textContent = litany.slice(0, i);
    els.cursor.textContent = litany[i] ?? '';
    els.rest.textContent = litany.slice(i + 1);
  }

  function beginRite() {
    if (phase !== 'choice') return;
    phase = 'rite';
    els.choice.hidden = true;
    els.rite.hidden = false;
    startedAt = performance.now();
    loop();
  }

  function loop() {
    if (phase === 'rite') {
      const frac = Math.min(1, (performance.now() - startedAt) / budgetMs);
      els.timerFill.style.width = `${(1 - frac) * 100}%`;
      if (frac >= 1) {
        resolve(false); // ran out of time — the rite fails
        return;
      }
    }
    rafHandle = requestAnimationFrame(loop);
  }

  function walkOn() {
    if (phase !== 'choice') return;
    phase = 'done';
    showResult(null);
  }

  function resolve(success: boolean) {
    if (phase !== 'rite') return;
    phase = 'done';
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    const result = resolveRite(player, event.id, success);
    showResult(result.charmId);
  }

  function showResult(charmId: string | null) {
    const titleKey = !charmId
      ? 'event_passed'
      : findCharm(charmId).kind === 'blessing'
        ? 'event_blessing'
        : 'event_scar';
    const parts = [t(titleKey)];
    if (charmId) parts.push(t(findCharm(charmId).nameKey));
    els.result.hidden = false;
    els.result.dataset.outcome = !charmId ? 'passed' : findCharm(charmId).kind;
    renderTextWithDropCap(els.result, parts.join(' · '));
    announce(parts.join('. '));
    if (charmId && findCharm(charmId).kind === 'blessing') sfxBoon();
    else if (charmId) sfxHurt();
    window.setTimeout(() => onDone(charmId), 1500);
  }

  function onKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (phase === 'choice') {
      if (e.key === 'Enter') {
        e.preventDefault();
        beginRite();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        walkOn();
      }
      return;
    }
    if (phase !== 'rite') return;
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
    if (e.key.toLowerCase() === expected.toLowerCase()) {
      typed += expected;
      correct += 1;
      sfxType();
      renderLitany();
      if (typed.length === litany.length) {
        // Finished in time — succeed only if it wasn't mashed out.
        const accuracy = correct / (correct + mistakes);
        resolve(accuracy >= RITE_MIN_ACCURACY);
      }
    } else {
      mistakes += 1;
      sfxTypo();
    }
  }

  function applyI18n() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n!);
      if (el.classList.contains('with-drop-cap')) renderTextWithDropCap(el, text);
      else el.textContent = text;
    });
  }

  const offLocale = onLocaleChange(() => {
    applyI18n();
    if (phase === 'rite') {
      // Litany text changed languages mid-rite — restart it cleanly.
      litany = t(event.litanyKey);
      typed = '';
      correct = 0;
      mistakes = 0;
      startedAt = performance.now();
      budgetMs = litany.length * EVENT_MS_PER_CHAR;
      renderLitany();
    }
  });

  applyI18n();
  renderLitany();
  els.timerFill.style.width = '100%';
  els.perform.addEventListener('click', beginRite);
  els.walk.addEventListener('click', walkOn);
  document.addEventListener('keydown', onKey);
  els.perform.focus();

  return () => {
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    document.removeEventListener('keydown', onKey);
    offLocale();
  };
}
