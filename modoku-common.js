/* Shared MODOKU-W browser helpers. Shows a blocking loading screen during GAS API calls. */
(() => {
  'use strict';

  const GAS_HOSTS = new Set(['script.google.com', 'script.googleusercontent.com']);
  const SHOW_DELAY_MS = 160;
  let activeRequests = 0;
  let showTimer = null;
  let overlay = null;
  let ready = false;

  function isGasRequest(value) {
    try {
      const raw = typeof value === 'string' ? value : (value && value.url) || String(value || '');
      const u = new URL(raw, window.location.href);
      if (!GAS_HOSTS.has(u.hostname)) return false;
      return u.pathname.includes('/macros/s/') ||
        u.pathname.includes('/macros/echo') ||
        u.pathname.endsWith('/exec') ||
        u.pathname.includes('/macros/');
    } catch (_) {
      return false;
    }
  }

  function createOverlay() {
    if (overlay || !document.body) return;
    overlay = document.createElement('div');
    overlay.id = 'modoku-network-loader';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="modoku-loader-content">
        <div class="modoku-loader-spinner" aria-hidden="true"></div>
        <div class="modoku-loader-title">NOW LOADING<span class="modoku-loader-dots"></span></div>
        <div class="modoku-loader-message">GAS / SPREADSHEET と通信しています。<br>画面を閉じずにそのままお待ちください。</div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function showOverlay() {
    if (!ready) return;
    createOverlay();
    if (!overlay) return;
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function beginRequest() {
    activeRequests += 1;
    if (activeRequests === 1) {
      if (showTimer) window.clearTimeout(showTimer);
      showTimer = window.setTimeout(() => {
        showTimer = null;
        if (activeRequests > 0) showOverlay();
      }, SHOW_DELAY_MS);
    }
  }

  function endRequest() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      if (showTimer) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
      hideOverlay();
    }
  }

  function init() {
    ready = true;
    createOverlay();
    if (activeRequests > 0) showOverlay();

    // Escape old header clipping/backdrop-filter stacking contexts by attaching menus to body.
    document.querySelectorAll('.side-menu, #side-menu').forEach(menu => {
      if (menu.parentElement !== document.body) document.body.appendChild(menu);
      menu.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
          // Normal navigation closes the menu by changing page; no extra action is needed.
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Most pages call GAS using fetch(). Keep existing logic untouched and wrap only GAS URLs.
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = function(input, initOptions) {
      if (!isGasRequest(input)) return originalFetch.apply(this, arguments);
      beginRequest();
      let requestPromise;
      try {
        requestPromise = originalFetch.apply(this, arguments);
      } catch (error) {
        endRequest();
        throw error;
      }
      return Promise.resolve(requestPromise).finally(endRequest);
    };
  }

  // Also cover any XMLHttpRequest-based GAS callers used by older embedded components.
  if (window.XMLHttpRequest && XMLHttpRequest.prototype && !XMLHttpRequest.prototype.__modokuWrapped) {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__modokuTracksGas = isGasRequest(url);
      return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      if (!this.__modokuTracksGas) return originalSend.apply(this, arguments);
      beginRequest();
      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        endRequest();
      };
      this.addEventListener('loadend', finish, { once: true });
      try {
        return originalSend.apply(this, arguments);
      } catch (error) {
        finish();
        throw error;
      }
    };
    XMLHttpRequest.prototype.__modokuWrapped = true;
  }

  // Optional manual hooks for tiny legacy components that cannot be detected as fetch/XHR.
  window.ModokuLoading = Object.freeze({
    start: beginRequest,
    end: endRequest,
    show: showOverlay,
    hide: hideOverlay,
    isLoading: () => activeRequests > 0
  });
})();
