/**
 * 個別指導塾 のびのびゼミ（架空）- Sample LP
 * Vanilla JavaScript（ライブラリ不使用）
 */
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initFadeIn();
  initCountdown();
  initTabs();
  initCountUp();
  initSlider();
  initForm();
  initFixedCta();
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ハンバーガーメニュー ---------- */
function initMenu() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('gnav');
  const header = document.querySelector('.header');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    // お知らせバーの高さがあっても、メニューがヘッダーの真下から始まるようにする
    if (open && header) nav.style.top = `${header.getBoundingClientRect().bottom}px`;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      btn.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && setOpen(false));
}

/* ---------- スクロールでフェードイン ---------- */
function initFadeIn() {
  const targets = document.querySelectorAll('.js-fade');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
}

/* ---------- キャンペーンのカウントダウン ---------- */
function initCountdown() {
  const box = document.getElementById('countdown');
  if (!box) return;
  const deadline = new Date(box.dataset.deadline).getTime();
  const units = {
    d: box.querySelector('[data-unit="d"]'),
    h: box.querySelector('[data-unit="h"]'),
    m: box.querySelector('[data-unit="m"]'),
    s: box.querySelector('[data-unit="s"]'),
  };
  const pad = (n) => String(n).padStart(2, '0');

  const update = () => {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      box.querySelector('.countdown__nums').hidden = true;
      box.querySelector('.countdown__label').hidden = true;
      box.querySelector('.countdown__end').hidden = false;
      clearInterval(timer);
      return;
    }
    const sec = Math.floor(diff / 1000);
    units.d.textContent = Math.floor(sec / 86400);
    units.h.textContent = pad(Math.floor((sec % 86400) / 3600));
    units.m.textContent = pad(Math.floor((sec % 3600) / 60));
    units.s.textContent = pad(sec % 60);
  };
  const timer = setInterval(update, 1000);
  update();
}

/* ---------- コースのタブ切り替え ---------- */
function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.course__tab'));
  if (!tabs.length) return;

  const activate = (tab, focus = false) => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.classList.toggle('is-active', selected);
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
      if (selected) panel.classList.add('is-visible');
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      const map = { ArrowRight: 1, ArrowLeft: -1 };
      if (e.key in map) {
        e.preventDefault();
        activate(tabs[(i + map[e.key] + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        activate(tabs[0], true);
      } else if (e.key === 'End') {
        e.preventDefault();
        activate(tabs[tabs.length - 1], true);
      }
    });
  });
}

/* ---------- 実績のカウントアップ ---------- */
function initCountUp() {
  const counters = document.querySelectorAll('.js-count');
  if (!counters.length) return;
  const run = (el) => {
    const to = Number(el.dataset.to);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (reduceMotion || !('IntersectionObserver' in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.to));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => io.observe(el));
}

/* ---------- 生徒の声スライダー（矢印・ドット・スワイプ・自動再生） ---------- */
function initSlider() {
  const root = document.getElementById('voiceSlider');
  if (!root) return;

  const track = root.querySelector('.slider__track');
  const slides = Array.from(track.children);
  const prev = root.querySelector('.slider__arrow--prev');
  const next = root.querySelector('.slider__arrow--next');
  const dotsWrap = root.querySelector('.slider__dots');
  const mqTab = window.matchMedia('(max-width: 1023px)');

  let index = 0;
  let timer = null;

  const perView = () => (mqTab.matches ? 1 : 2);
  const maxIndex = () => slides.length - perView();

  const buildDots = () => {
    dotsWrap.replaceChildren();
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${i + 1}番目を表示`);
      dot.addEventListener('click', () => {
        goTo(i);
        restart();
      });
      dotsWrap.append(dot);
    }
  };

  const goTo = (i) => {
    index = Math.max(0, Math.min(i, maxIndex()));
    track.style.transform = `translateX(-${(100 / perView()) * index}%)`;
    prev.disabled = index === 0;
    next.disabled = index === maxIndex();
    Array.from(dotsWrap.children).forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    slides.forEach((s, n) => {
      const visible = n >= index && n < index + perView();
      s.setAttribute('aria-hidden', String(!visible));
      s.inert = !visible;
    });
  };

  const stop = () => clearInterval(timer);
  const restart = () => {
    stop();
    if (reduceMotion) return;
    timer = setInterval(() => goTo(index >= maxIndex() ? 0 : index + 1), 5000);
  };

  prev.addEventListener('click', () => { goTo(index - 1); restart(); });
  next.addEventListener('click', () => { goTo(index + 1); restart(); });

  // マウスを乗せている間・キーボード操作中は自動再生を止める
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', restart);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', restart);

  // スワイプ操作
  const viewport = root.querySelector('.slider__viewport');
  let startX = 0;
  let deltaX = 0;
  let dragging = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    dragging = true;
    startX = e.clientX;
    deltaX = 0;
    track.classList.add('is-dragging');
    stop();
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    deltaX = e.clientX - startX;
    const base = (100 / perView()) * index;
    const percent = (deltaX / viewport.offsetWidth) * 100;
    track.style.transform = `translateX(calc(-${base}% + ${percent}%))`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (Math.abs(deltaX) > 50) goTo(index + (deltaX < 0 ? 1 : -1));
    else goTo(index);
    restart();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  mqTab.addEventListener('change', () => {
    buildDots();
    goTo(index);
  });

  buildDots();
  goTo(0);
  restart();
}

/* ---------- 申し込みフォームの入力チェック ---------- */
function initForm() {
  const form = document.getElementById('entryForm');
  if (!form) return;

  const rules = {
    grade: (v) => (v ? '' : '学年を選択してください。'),
    sname: (v) => (v.trim() ? '' : '生徒さまのお名前を入力してください。'),
    ptel: (v) => {
      if (!v.trim()) return '電話番号を入力してください。';
      return /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(v.trim()) ? '' : '電話番号の形式が正しくありません（例：090-1234-5678）。';
    },
    pmail: (v) => {
      if (!v.trim()) return 'メールアドレスを入力してください。';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'メールアドレスの形式が正しくありません。';
    },
  };

  const validate = (id) => {
    const input = document.getElementById(id);
    const msg = rules[id](input.value);
    input.classList.toggle('is-error', Boolean(msg));
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    if (msg) input.setAttribute('aria-describedby', `${id}-error`);
    else input.removeAttribute('aria-describedby');
    document.getElementById(`${id}-error`).textContent = msg;
    return !msg;
  };

  Object.keys(rules).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'blur', () => validate(id));
    input.addEventListener('input', () => input.classList.contains('is-error') && validate(id));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = Object.keys(rules);
    const ok = ids.map(validate);
    const firstError = ids[ok.indexOf(false)];
    if (firstError) {
      document.getElementById(firstError).focus();
      return;
    }
    // サンプルのため送信せず、完了メッセージを表示
    form.hidden = true;
    const done = document.getElementById('entryDone');
    done.hidden = false;
    done.focus();
  });
}

/* ---------- スマホ用の追従ボタン ---------- */
function initFixedCta() {
  const cta = document.getElementById('fixedCta');
  const fv = document.querySelector('.fv');
  const entry = document.getElementById('entry');
  if (!cta || !fv || !entry) return;
  let ticking = false;
  const update = () => {
    const pastFv = window.scrollY > fv.offsetTop + fv.offsetHeight;
    const r = entry.getBoundingClientRect();
    const entryVisible = r.top < window.innerHeight && r.bottom > 0;
    cta.classList.toggle('is-show', pastFv && !entryVisible);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}
