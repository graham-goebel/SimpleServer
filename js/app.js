/**
 * Gallery — interaction.
 *
 * Three states, in order of depth:
 *   browsing  — the whole wall, hover a frame for its label
 *   focused   — one frame flies to the middle, the rest blur back, panel opens
 *   cart      — a drawer over everything
 */
import { PRINTS, SIZES, FRAMES, priceOf, money } from './data.js';

const $ = (sel) => document.querySelector(sel);

const el = {
  room: $('#room'),
  wall: $('#wall'),
  tip: $('#tip'),
  tipTitle: $('#tip .tip__title'),
  tipMeta: $('#tip .tip__meta'),
  tipPrice: $('#tip .tip__price'),
  scrim: $('#scrim'),
  panel: $('#panel'),
  panelClose: $('#panel-close'),
  tags: $('#panel-tags'),
  title: $('#panel-title'),
  artist: $('#panel-artist'),
  blurb: $('#panel-blurb'),
  spec: $('#panel-spec'),
  sizeOptions: $('#size-options'),
  frameOptions: $('#frame-options'),
  price: $('#panel-price'),
  priceNote: $('#panel-price-note'),
  addToCart: $('#add-to-cart'),
  prev: $('#prev-print'),
  next: $('#next-print'),
  cart: $('#cart'),
  cartButton: $('#cart-button'),
  cartClose: $('#cart-close'),
  cartCount: $('#cart-count'),
  cartItems: $('#cart-items'),
  cartEmpty: $('#cart-empty'),
  cartTotal: $('#cart-total'),
  checkout: $('#checkout'),
  lightswitch: $('#lightswitch'),
  toast: $('#toast'),
};

const state = {
  focused: null,          // print id currently in focus
  size: SIZES[0].id,
  frame: FRAMES[0].id,
  cart: [],               // { printId, size, frame, qty }
  lastTrigger: null,      // element to restore focus to
};

const frameEls = new Map();
const byId = (id) => PRINTS.find((p) => p.id === id);
const phone = () => window.matchMedia('(max-width: 880px)').matches;

/* ------------------------------------------------------------------ wall */

function buildWall() {
  const list = document.createDocumentFragment();

  for (const print of PRINTS) {
    const frame = document.createElement('button');
    frame.type = 'button';
    frame.className = `frame frame--${print.frame} frame--mat-${print.mat}`;
    frame.id = `frame-${print.id}`;
    frame.dataset.id = print.id;
    frame.style.setProperty('--x', print.wall.x);
    frame.style.setProperty('--y', print.wall.y);
    frame.style.setProperty('--w', print.wall.w);
    frame.style.setProperty('--ratio', String(print.ratio));
    frame.setAttribute('role', 'listitem');
    frame.setAttribute('aria-label',
      `${print.title} by ${print.artist}, ${print.year}. From ${money(priceOf(print, 's', 'none'))}.`);

    frame.innerHTML = `
      <span class="frame__mount">
        <span class="frame__mat">
          <span class="frame__art">
            <img src="${print.art}" alt="" loading="lazy" draggable="false">
            <span class="frame__glass"></span>
          </span>
        </span>
      </span>`;

    frame.addEventListener('click', () => {
      state.lastTrigger = frame;
      state.focused === print.id ? unfocus() : focusPrint(print.id);
    });
    frame.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && showTip(print, frame));
    frame.addEventListener('pointerleave', hideTip);
    frame.addEventListener('focus', () => !state.focused && showTip(print, frame));
    frame.addEventListener('blur', hideTip);

    frameEls.set(print.id, frame);
    list.append(frame);
  }

  el.wall.append(list);
}

/* --------------------------------------------------------------- the tip */

function showTip(print, frame) {
  if (state.focused || phone()) return;

  el.tipTitle.textContent = print.title;
  el.tipMeta.textContent = `${print.artist} · ${print.year}`;
  el.tipPrice.textContent = `From ${money(priceOf(print, 's', 'none'))}`;
  el.tip.setAttribute('aria-hidden', 'false');
  el.tip.classList.add('is-on');

  // Measure after filling so the clamp uses the real width.
  const box = frame.getBoundingClientRect();
  const tip = el.tip.getBoundingClientRect();
  const margin = 12;

  let left = box.left + box.width / 2 - tip.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin));

  let top = box.top - tip.height - 10;
  if (top < margin) top = Math.min(box.bottom + 10, window.innerHeight - tip.height - margin);

  el.tip.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}

function hideTip() {
  el.tip.classList.remove('is-on');
  el.tip.setAttribute('aria-hidden', 'true');
}

/* ------------------------------------------------------------ focus mode */

let scrollbarPad = 0;
let hideTimer;

function lockScroll(on) {
  if (on) {
    scrollbarPad = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarPad ? `${scrollbarPad}px` : '';
    document.body.classList.add('is-locked');
  } else {
    document.body.classList.remove('is-locked');
    document.body.style.paddingRight = '';
  }
}

/** Keep the panel and cart clear of the sticky top bar. */
function measureBar() {
  const bar = document.querySelector('.topbar').offsetHeight;
  document.documentElement.style.setProperty('--bar', `${bar}px`);
  return bar;
}

/**
 * Fly the active frame into whatever space the panel leaves free, and scale it
 * to fill that space without cropping or overshooting.
 */
function placeFocused() {
  const frame = frameEls.get(state.focused);
  if (!frame) return;

  frame.style.transform = '';
  const box = frame.getBoundingClientRect();
  const small = phone();
  const bar = measureBar();

  const pad = small ? 16 : 44;
  const area = small
    ? { x: 0, y: bar, w: window.innerWidth, h: window.innerHeight - bar - el.panel.offsetHeight }
    : { x: 0, y: bar, w: window.innerWidth - el.panel.offsetWidth, h: window.innerHeight - bar };

  const scale = Math.min((area.w - pad * 2) / box.width, (area.h - pad * 2) / box.height, 3.4);
  const dx = area.x + area.w / 2 - (box.left + box.width / 2);
  const dy = area.y + area.h / 2 - (box.top + box.height / 2);

  frame.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
}

function focusPrint(id) {
  const print = byId(id);
  if (!print) return;

  const wasOpen = Boolean(state.focused);

  if (state.focused && state.focused !== id) {
    frameEls.get(state.focused)?.classList.remove('is-active');
    frameEls.get(state.focused)?.style.setProperty('transform', '');
  }

  hideTip();
  state.focused = id;
  state.size = SIZES[0].id;
  state.frame = defaultFrameFor(print);

  fillPanel(print);

  lockScroll(true);
  el.room.classList.add('is-focused');
  frameEls.get(id).classList.add('is-active');
  frameEls.get(id).setAttribute('aria-expanded', 'true');

  for (const [pid, node] of frameEls) node.tabIndex = pid === id ? 0 : -1;

  clearTimeout(hideTimer);
  el.scrim.hidden = false;
  el.panel.hidden = false;
  requestAnimationFrame(() => {
    el.scrim.classList.add('is-open');
    el.panel.classList.add('is-open');
    el.panel.setAttribute('aria-hidden', 'false');
    placeFocused();
    if (!wasOpen) el.panelClose.focus({ preventScroll: true });
  });

  history.replaceState(null, '', `#${id}`);
}

function unfocus() {
  if (!state.focused) return;

  const frame = frameEls.get(state.focused);
  frame?.classList.remove('is-active');
  frame?.style.setProperty('transform', '');
  frame?.removeAttribute('aria-expanded');

  el.room.classList.remove('is-focused');
  el.scrim.classList.remove('is-open');
  el.panel.classList.remove('is-open');
  el.panel.setAttribute('aria-hidden', 'true');

  state.focused = null;
  for (const node of frameEls.values()) node.tabIndex = 0;

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (state.focused) return;          // reopened in the meantime
    el.panel.hidden = true;
    el.scrim.hidden = true;
  }, 520);

  lockScroll(false);
  history.replaceState(null, '', location.pathname + location.search);
  (state.lastTrigger ?? frame)?.focus({ preventScroll: true });
}

/** A print framed in its own moulding reads best as the default. */
function defaultFrameFor(print) {
  return FRAMES.some((f) => f.id === print.frame) ? print.frame : FRAMES[0].id;
}

function step(delta) {
  const i = PRINTS.findIndex((p) => p.id === state.focused);
  if (i < 0) return;
  const next = PRINTS[(i + delta + PRINTS.length) % PRINTS.length];
  state.lastTrigger = frameEls.get(next.id);
  focusPrint(next.id);
}

/* ----------------------------------------------------------- detail pane */

function fillPanel(print) {
  el.panel.querySelector('.panel__scroll').scrollTop = 0;
  el.tags.textContent = print.tags.join(' · ');
  el.title.textContent = print.title;
  el.artist.textContent = `${print.artist}, ${print.year}`;
  el.blurb.textContent = print.blurb;

  el.spec.replaceChildren(
    ...[
      ['Medium', print.medium],
      ['Edition', print.edition],
      ['Made in', print.place],
      ['Ships', 'Flat, within 5 business days'],
    ].flatMap(([term, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = value;
      return [dt, dd];
    })
  );

  el.sizeOptions.replaceChildren(
    ...SIZES.map((size) =>
      optionControl('size', size.id, size.label, size.note, size.id === state.size))
  );
  el.frameOptions.replaceChildren(
    ...FRAMES.map((frame) =>
      optionControl('frame', frame.id, frame.label, frame.note, frame.id === state.frame))
  );

  updatePrice();
}

function optionControl(group, value, label, note, checked) {
  const wrap = document.createElement('label');
  wrap.className = 'opt';

  const input = document.createElement('input');
  input.type = 'radio';
  input.name = group;
  input.value = value;
  input.checked = checked;
  input.addEventListener('change', () => {
    state[group] = value;
    updatePrice();
  });

  const face = document.createElement('span');
  face.className = 'opt__face';
  face.innerHTML = `<strong></strong><span></span>`;
  face.querySelector('strong').textContent = label;
  face.querySelector('span').textContent = note;

  wrap.append(input, face);
  return wrap;
}

function updatePrice() {
  const print = byId(state.focused);
  if (!print) return;
  const frame = FRAMES.find((f) => f.id === state.frame);
  el.price.textContent = money(priceOf(print, state.size, state.frame));
  el.priceNote.textContent = frame.add
    ? `includes ${frame.label.toLowerCase()} framing`
    : 'unframed, ships rolled';
}

/* ------------------------------------------------------------------ cart */

const CART_KEY = 'gallery.cart.v1';

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    state.cart = Array.isArray(raw)
      ? raw.filter((line) => byId(line.printId) && Number.isFinite(line.qty) && line.qty > 0)
      : [];
  } catch {
    state.cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  } catch {
    /* private mode, or storage full — the cart just won't outlive the tab */
  }
}

function addToCart() {
  const print = byId(state.focused);
  if (!print) return;

  const match = state.cart.find(
    (line) => line.printId === print.id && line.size === state.size && line.frame === state.frame);

  match ? (match.qty += 1)
        : state.cart.push({ printId: print.id, size: state.size, frame: state.frame, qty: 1 });

  saveCart();
  renderCart();
  bumpCount();
  toast(`${print.title} added to your cart`);
}

function lineTotal(line) {
  return priceOf(byId(line.printId), line.size, line.frame) * line.qty;
}

function renderCart() {
  const count = state.cart.reduce((n, line) => n + line.qty, 0);
  el.cartCount.textContent = String(count);
  el.cartCount.dataset.empty = String(count === 0);
  el.cartEmpty.hidden = count > 0;
  el.cartTotal.textContent = money(state.cart.reduce((sum, line) => sum + lineTotal(line), 0));
  el.checkout.disabled = count === 0;

  el.cartItems.replaceChildren(
    ...state.cart.map((line, index) => {
      const print = byId(line.printId);
      const size = SIZES.find((s) => s.id === line.size);
      const frame = FRAMES.find((f) => f.id === line.frame);

      const li = document.createElement('li');
      li.className = 'cart__item';
      li.innerHTML = `
        <span class="cart__thumb"><img src="${print.art}" alt=""></span>
        <div>
          <p class="cart__name"></p>
          <p class="cart__opts"></p>
          <span class="cart__qty">
            <button type="button" data-step="-1" aria-label="One fewer">&minus;</button>
            <span></span>
            <button type="button" data-step="1" aria-label="One more">+</button>
          </span>
        </div>
        <div>
          <p class="cart__line"></p>
          <button type="button" class="cart__remove">Remove</button>
        </div>`;

      li.querySelector('.cart__name').textContent = print.title;
      li.querySelector('.cart__opts').textContent = `${size.label} · ${frame.label}`;
      li.querySelector('.cart__qty span').textContent = String(line.qty);
      li.querySelector('.cart__line').textContent = money(lineTotal(line));

      li.querySelectorAll('[data-step]').forEach((button) =>
        button.addEventListener('click', () => {
          line.qty += Number(button.dataset.step);
          if (line.qty < 1) state.cart.splice(index, 1);
          saveCart();
          renderCart();
        }));

      li.querySelector('.cart__remove').addEventListener('click', () => {
        state.cart.splice(index, 1);
        saveCart();
        renderCart();
      });

      return li;
    })
  );
}

function bumpCount() {
  el.cartCount.classList.add('is-bumped');
  setTimeout(() => el.cartCount.classList.remove('is-bumped'), 320);
}

let cartTimer;
function openCart(open) {
  clearTimeout(cartTimer);
  el.cart.hidden = false;
  requestAnimationFrame(() => {
    el.cart.classList.toggle('is-open', open);
    el.cart.setAttribute('aria-hidden', String(!open));
    el.cartButton.setAttribute('aria-expanded', String(open));
    if (open) {
      el.cartClose.focus({ preventScroll: true });
    } else {
      cartTimer = setTimeout(() => {
        if (!el.cart.classList.contains('is-open')) el.cart.hidden = true;
      }, 460);
    }
  });
}

/* ----------------------------------------------------------------- toast */

let toastTimer;
function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('is-on'), 2600);
}

/* ----------------------------------------------------------------- wiring */

function wire() {
  el.scrim.addEventListener('click', unfocus);
  el.panelClose.addEventListener('click', unfocus);
  el.prev.addEventListener('click', () => step(-1));
  el.next.addEventListener('click', () => step(1));
  el.addToCart.addEventListener('click', addToCart);

  el.cartButton.addEventListener('click', () => openCart(!el.cart.classList.contains('is-open')));
  el.cartClose.addEventListener('click', () => { openCart(false); el.cartButton.focus(); });
  el.checkout.addEventListener('click', () =>
    toast('This is a demo shop — nothing is actually for sale.'));

  el.lightswitch.addEventListener('click', () => {
    const night = document.documentElement.dataset.room !== 'night';
    document.documentElement.dataset.room = night ? 'night' : 'day';
    el.lightswitch.setAttribute('aria-pressed', String(night));
    el.lightswitch.querySelector('.lightswitch__label').textContent =
      night ? 'Lights up' : 'Dim the room';
    try { localStorage.setItem('gallery.room', document.documentElement.dataset.room); } catch {}
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (el.cart.classList.contains('is-open')) { openCart(false); el.cartButton.focus(); }
      else if (state.focused) unfocus();
    }
    if (!state.focused) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    hideTip();
    measureBar();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => state.focused && placeFocused(), 120);
  });

  window.addEventListener('scroll', hideTip, { passive: true });
}

/* ------------------------------------------------------------------ boot */

function restoreRoom() {
  let saved;
  try { saved = localStorage.getItem('gallery.room'); } catch {}
  if (saved === 'night') el.lightswitch.click();
}

buildWall();
wire();
measureBar();
loadCart();
renderCart();
restoreRoom();

// Deep link: /#monument opens that print, on arrival or when the hash changes.
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && byId(id) && state.focused !== id) requestAnimationFrame(() => focusPrint(id));
}

window.addEventListener('hashchange', openFromHash);
openFromHash();
