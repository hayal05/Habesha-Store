/* Habesha Store: tiny progressive enhancements (no dependencies).
   Add to <head> before CSS paint:  <script>document.documentElement.classList.add('has-js')</script> */
(() => {
  // Mobile menu toggle
  const btn = document.querySelector('[data-menu-toggle]');
  const nav = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (btn && nav) {
    const set = (open) => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      const page = nav.classList.contains('dash-nav') && document.getElementById('main');
      if (page) page.inert = open;               // the dashboard drawer works like a dialog: Tab stays in the drawer and the menu button
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
  }

  // Row menus (<details class="menu">): close on outside click or Escape
  const menus = () => document.querySelectorAll('details.menu[open]');
  document.addEventListener('click', (e) => menus().forEach((m) => { if (!m.contains(e.target)) m.removeAttribute('open'); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menus().forEach((m) => { m.removeAttribute('open'); m.querySelector('summary').focus(); });
  });

  // Platform filter: submit the search form as soon as the choice changes
  // Only for mouse and touch: arrow keys change radios one step at a time, so a reload on each key press would trap keyboard users
  // (they press Enter to search instead).
  document.querySelectorAll('form[data-autosubmit] .platform-filter').forEach((group) => {
    let pointer = false;
    group.addEventListener('pointerdown', () => { pointer = true; });
    group.addEventListener('keydown', (e) => { pointer = false; if (e.key === 'Enter') group.form.requestSubmit(); });
    group.addEventListener('change', (e) => { if (pointer) e.target.form.requestSubmit(); });
  });

  // Download page: start the file by itself shortly after the page appears (the visible button is the fallback)
  const auto = document.querySelector('a[data-autostart]');
  if (auto) setTimeout(() => auto.click(), 900);

  // App icons: if an image fails to load, swap in the lettered fallback (no broken-image glyph)
  const toFallback = (img) => {
    const box = img.closest('.app-icon');
    if (!box || box.classList.contains('app-icon--fallback')) return;
    box.dataset.initial = (box.dataset.initial || img.dataset.name || '?').trim().charAt(0).toUpperCase();
    box.classList.add('app-icon--fallback');
    img.remove();
  };
  document.addEventListener('error', (e) => {
    if (e.target.matches && e.target.matches('.app-icon__img')) toFallback(e.target);
  }, true);   // error events do not bubble, so listen in the capture phase
  document.querySelectorAll('.app-icon__img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) toFallback(img);  // failed before this script ran
  });

  // Toasts: showToast("Saved", { type: "success" | "error" | "info" | "warning", timeout: ms (0 = stay) })
  window.showToast = (message, { type = 'info', timeout } = {}) => {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', 'Notifications');
      region.setAttribute('aria-live', 'polite');
      document.body.append(region);
    }
    while (region.children.length >= 3) region.firstElementChild.remove();

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    if (type === 'error') el.setAttribute('role', 'alert');
    const text = document.createElement('p');
    text.className = 'toast__text';
    text.textContent = message;               // textContent: never inject HTML
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast__close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '\u00d7';
    el.append(text, close);
    region.append(el);

    const ms = timeout ?? (type === 'error' ? 8000 : 5000);
    let timer;
    const dismiss = () => { clearTimeout(timer); el.classList.add('is-leaving'); setTimeout(() => el.remove(), 200); };
    const arm = () => { if (ms > 0) timer = setTimeout(dismiss, ms); };
    close.addEventListener('click', dismiss);
    el.addEventListener('mouseenter', () => clearTimeout(timer));   // pause while hovered or focused
    el.addEventListener('focusin', () => clearTimeout(timer));
    el.addEventListener('mouseleave', arm);
    el.addEventListener('focusout', arm);
    arm();
    return dismiss;
  };

  // Auth and publish/edit forms: inline validation, password toggle, and a fetch submit with loading / success / error states.
  // Without JS the form still posts normally (native validation, server redirect). Rules mirror lib/auth.js and lib/publish.js.
  document.querySelectorAll('form[data-auth-form], form[data-app-form]').forEach((form) => {
    form.noValidate = true;                                  // our messages replace the browser bubbles
    const slot = form.querySelector('[data-alert-slot]');
    const fields = form.querySelector('fieldset');
    const submit = form.querySelector('button[type="submit"]');
    const inputs = [...form.querySelectorAll('.input, input[type="file"][required]')];

    const showAlert = (tone, text, href) => {
      slot.replaceChildren();
      if (!text) return;
      const box = document.createElement('div');
      box.className = `alert alert--${tone}`;
      box.setAttribute('role', tone === 'success' ? 'status' : 'alert');
      const body = document.createElement('div');
      body.className = 'alert__body';
      const p = document.createElement('p');
      p.className = 'alert__text';
      p.textContent = text;
      if (href) {                                            // sign-in opens in a new tab so the form (and its chosen files) stays as it is
        const a = Object.assign(document.createElement('a'), { href, target: '_blank', rel: 'noopener', textContent: 'Sign in' });
        a.append(Object.assign(document.createElement('span'), { className: 'visually-hidden', textContent: ' (opens in a new tab)' }));
        p.append(' ', a);
      }
      body.append(p);
      box.append(body);
      slot.append(box);
      box.scrollIntoView({ block: 'nearest' });
    };
    const setError = (input, text) => {
      const up = input.closest('[data-upload]');                 // upload areas keep their message and border inside their own box
      (up ? up.querySelector('.field__error') : form.querySelector(`#${input.id}-err`)).textContent = text;
      if (up) up.querySelector('.dropzone').classList.toggle('is-invalid', Boolean(text));
      input.setAttribute('aria-invalid', String(Boolean(text)));
      return !text;
    };
    const validate = (input) => {
      const file = input.type === 'file';
      const v = file ? input.files.length : input.name === 'password' ? input.value : input.value.trim();   // passwords are never trimmed
      const min = input.minLength > 0 ? input.minLength : 0;
      const empty = (file ? input.closest('[data-upload]') : input).dataset.empty;
      const bad = { apk: 'ios', app_store: 'android', testflight: 'android' };   // distribution that does not fit the chosen platform
      return setError(input,
        (!v && input.required && (empty || `Enter your ${input.dataset.noun}.`)) ||
        (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && 'Enter a valid email address.') ||
        (input.type === 'url' && v && !/^https?:\/\/\S+$/i.test(v) && 'Enter a link that starts with http:// or https://.') ||
        (input.type === 'number' && v && !(Number(v) >= Number(input.min) && Number(v) <= Number(input.max)) && `Enter a size in MB between ${input.min} and ${input.max}.`) ||
        (input.name === 'distribution' && bad[v] === form.elements.platform.value &&
          (v === 'apk' ? 'iOS apps cannot be a direct APK download. Choose App Store, TestFlight or a link.' : 'App Store and TestFlight links are for iOS apps.')) ||
        (v.length < min && `Use at least ${min} characters.`) || '');
    };
    const setBusy = (busy) => {
      fields.disabled = busy;
      if (busy) submit.setAttribute('aria-busy', 'true'); else submit.removeAttribute('aria-busy');
    };

    form.querySelectorAll('[data-pw-toggle]').forEach((btn) => {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
      });
    });

    // Check a field when the person leaves it (only if they typed something), and clear the error as they fix it.
    form.addEventListener('focusout', (e) => { if (e.target.matches('.input') && (e.target.value || e.target.getAttribute('aria-invalid') === 'true')) validate(e.target); });
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') validate(e.target); });
    window.addEventListener('pageshow', (e) => { if (e.persisted) setBusy(false); });   // back button after success
    form.elements.platform?.addEventListener('change', () => validate(form.elements.distribution));   // the platform decides which downloads are allowed

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submit.getAttribute('aria-busy') === 'true') return;
      showAlert('', '');
      const bad = inputs.filter((i) => !validate(i));
      if (bad.length) { bad[0].focus(); return; }
      const body = new FormData(form);                       // read before the fields are disabled
      setBusy(true);
      try {
        const res = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' } });
        const data = await res.json();
        if (res.status === 401 && data.redirect) {             // session ran out while the form was open: keep the form, sign in elsewhere
          showAlert('danger', 'Your session expired. Your changes are still here. Sign in in a new tab, then save again.', data.redirect);
          setBusy(false);
          return;
        }
        if (data.redirect) { showAlert(res.ok ? 'success' : 'danger', data.message); location.assign(data.redirect); return; }   // also sign-in or missing-app redirects   // stay busy while the page changes
        const named = Object.entries(data.errors || {}).filter(([n]) => form.elements[n]);
        named.forEach(([n, text]) => setError(form.elements[n], text));
        if (!named.length) showAlert('danger', data.message);
        setBusy(false);
        if (named.length) form.elements[named[0][0]].focus();   // the alert announces itself; field errors need focus
      } catch {
        showAlert('danger', 'We could not complete that. Check your connection and try again.');
        setBusy(false);
      }
    });
  });

  // Upload areas: type/size/dimension checks, previews, remove, drag-and-drop
  document.querySelectorAll('[data-upload]').forEach((root) => {
    const input = root.querySelector('input[type="file"]');
    const zone = root.querySelector('.dropzone');
    const list = root.querySelector('.upload__list');
    const msg = root.querySelector('.field__error');
    const count = root.querySelector('.upload__count');
    const max = Number(root.dataset.max) || 1;
    const maxMb = Number(root.dataset.maxMb) || 5;
    const minPx = Number(root.dataset.minPx) || 0;
    const noun = root.dataset.noun || 'images';
    const allowed = input.accept.split(',').map((t) => t.trim());
    const names = allowed.map((t) => ({ 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[t] || t.split('/')[1].toUpperCase()));
    let files = [];

    const error = (text) => {
      msg.textContent = text;
      zone.classList.toggle('is-invalid', Boolean(text));
      input.setAttribute('aria-invalid', String(Boolean(text)));
    };
    const sync = () => {
      const dt = new DataTransfer();                       // lets us drop single files from a multi-file input
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      if (count) count.textContent = `${list.children.length} of ${max} ${noun}`;
    };
    const removeItem = (item) => {
      if (item._file) { files = files.filter((f) => f !== item._file); URL.revokeObjectURL(item._url); }
      else if (item.dataset.id && root.dataset.removedName) {
        const h = Object.assign(document.createElement('input'), { type: 'hidden', name: root.dataset.removedName, value: item.dataset.id });
        root.append(h);
      }
      item.remove();
    };

    const addItem = (file) => {
      const item = document.createElement('li');
      item.className = 'upload__item';
      item._file = file;
      item._url = URL.createObjectURL(file);
      const img = new Image();
      img.className = 'upload__thumb';
      img.alt = `Preview of ${file.name}`;
      img.onerror = () => { removeItem(item); sync(); error(`\u201c${file.name}\u201d could not be read as an image.`); };
      img.onload = () => {
        const bad = (minPx && (img.naturalWidth < minPx || img.naturalHeight < minPx) && `must be at least ${minPx}\u00d7${minPx} pixels.`)
          || (root.dataset.square === 'true' && Math.abs(img.naturalWidth - img.naturalHeight) / Math.max(img.naturalWidth, img.naturalHeight) > 0.02 && 'must be square.');
        if (bad) { removeItem(item); sync(); error(`\u201c${file.name}\u201d ${bad}`); }
      };
      img.src = item._url;
      const name = document.createElement('span');
      name.className = 'upload__name';
      name.textContent = file.name;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'upload__remove';
      del.setAttribute('aria-label', `Remove ${file.name}`);
      del.textContent = '\u00d7';
      item.append(img, name, del);
      list.append(item);
    };

    const add = (incoming) => {
      error('');
      let picked = [...incoming];
      if (max === 1 && picked.length) { picked = picked.slice(0, 1); [...list.children].forEach(removeItem); files = []; }
      for (const file of picked) {
        if (!allowed.includes(file.type)) { error(`\u201c${file.name}\u201d is not supported. Use ${names.slice(0, -1).join(', ')} or ${names.at(-1)}.`); continue; }
        if (file.size > maxMb * 1048576) { error(`\u201c${file.name}\u201d is larger than ${maxMb} MB.`); continue; }
        if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
        if (list.children.length >= max) { error(`You can add up to ${max} ${noun}.`); break; }
        files.push(file);
        addItem(file);
      }
      sync();
    };

    input.addEventListener('change', () => add(input.files));
    list.addEventListener('click', (e) => {
      const del = e.target.closest('.upload__remove');
      if (!del) return;
      removeItem(del.closest('.upload__item'));
      error('');
      sync();
      input.focus();
    });
    ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, () => zone.classList.remove('is-dragover')));
    zone.addEventListener('drop', (e) => { e.preventDefault(); add(e.dataTransfer.files); });
    sync();
  });

  // App details page (Play-style): back, share, "Read more", and the bottom bar that appears once the main button scrolls away.
  document.querySelectorAll('[data-back]').forEach((a) => a.addEventListener('click', (e) => {
    if (history.length > 1 && document.referrer.startsWith(location.origin)) { e.preventDefault(); history.back(); }
  }));
  document.querySelectorAll('[data-share]').forEach((btn) => btn.addEventListener('click', async () => {
    const data = { title: btn.dataset.title, url: location.href.split('#')[0] };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.url);
      window.showToast('Link copied', { type: 'success', timeout: 2500 });
    } catch (e) { if (e.name !== 'AbortError') window.showToast('Could not share. Copy the address from your browser.', { type: 'error' }); }
  }));
  document.querySelectorAll('[data-clamp]').forEach((box) => {
    const btn = box.parentElement.querySelector('[data-clamp-toggle]');
    if (!btn) return;
    if (box.scrollHeight <= box.clientHeight + 2) { btn.hidden = true; return; }   // short text: nothing to expand
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = box.classList.toggle('is-open');
      btn.textContent = open ? 'Show less' : 'Read more';
      btn.setAttribute('aria-expanded', open);
    });
  });
  const anchor = document.querySelector('[data-cta-anchor]'), bar = document.querySelector('.action-bar');
  if (anchor && bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => bar.classList.toggle('is-visible', !e.isIntersecting)).observe(anchor);
  }
})();
