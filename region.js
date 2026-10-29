/* Region switch: US visitors -> /us/ pages, everyone else stays on the SA site.
   Loaded on the SA pages (index, pricing) and on the /us/ pages.
   - Never blocks rendering (script is deferred; geo lookup is async with a timeout).
   - Any failure falls through to whatever page the visitor is already on.
   - Manual switch link is on every page, so geo detection is never the only way in.
   - Test locally with ?region=us (forces US) or ?region=za (forces SA). */
(function () {
  "use strict";

  // Guard: run only once even if a page includes this script twice.
  if (window.__regionSwitchLoaded) return;
  window.__regionSwitchLoaded = true;

  var GEO_URL = "https://ipwho.is/?fields=success,country_code";
  var GEO_TIMEOUT_MS = 2500;
  var KEY = "site_region";            // localStorage: visitor's explicit choice ("us" | "za")
  var CHECKED = "site_region_checked"; // sessionStorage: geo already looked up this session

  var root = document.documentElement;
  var onUS = root.getAttribute("data-region") === "us";

  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); } catch (e) { /* storage blocked */ } }

  // Page leaf, e.g. "pricing.html"; "" (site root or /us/) maps to "index.html".
  var leaf = location.pathname.replace(/\\/g, "/").split("/").pop();
  if (!/\.html?$/i.test(leaf)) leaf = "index.html";

  var inBlog = /\/blog\/[^\/]+\.html?$/i.test(location.pathname.replace(/\\/g, "/"));
  var usUrl = onUS ? leaf : (inBlog ? "../us/blog/" : "us/") + leaf;
  var zaUrl = onUS ? (inBlog ? "../../blog/" : "../") + leaf : leaf;
  var target = onUS ? zaUrl : usUrl;

  // ?region=us|za override (also records the choice, like a manual switch).
  var forced = (location.search.match(/[?&]region=(us|za)(?:&|$)/) || [])[1];
  if (forced) {
    set("localStorage", KEY, forced);
    if (forced === "us" && !onUS) { location.replace(usUrl); return; }
    if (forced === "za" && onUS) { location.replace(zaUrl); return; }
  }

  // Search/preview crawlers (often US-based) must keep seeing the SA pages, so never auto-redirect them.
  var isBot = /bot|crawl|spider|slurp|lighthouse|pagespeed|facebookexternalhit|headless/i.test(navigator.userAgent || "");

  // Automatic redirect: SA pages only, only if the visitor hasn't chosen, once per session.
  if (!onUS && !forced && !isBot) {
    var chosen = get("localStorage", KEY);
    if (chosen === "us") {
      location.replace(usUrl);
      return;
    }
    if (!chosen && !get("sessionStorage", CHECKED)) {
      set("sessionStorage", CHECKED, "1");
      var done = false;
      var ctl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, GEO_TIMEOUT_MS);
      fetch(GEO_URL, ctl ? { signal: ctl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (d) {
          clearTimeout(timer);
          if (done) return;
          done = true;
          if (d && d.success && d.country_code === "US") {
            set("localStorage", KEY, "us");
            location.replace(usUrl);
          }
        })
        .catch(function () { clearTimeout(timer); /* lookup failed: stay on the SA site */ });
    }
  }

  // ---- Switch bar + draft-pricing banner (DOM work waits for the body) ----
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var css = document.createElement("style");
    css.textContent =
      ".region-bar{background:#0b1f4d;color:#dbe5ff;font:500 13px/1.4 'DM Sans',system-ui,sans-serif;text-align:center;padding:8px 16px}" +
      ".region-bar a{color:#fff;font-weight:700;text-decoration:underline;margin-left:6px}" +
      "a.whatsapp.email-fab{background:#123db8;border-color:#0b2f93;text-decoration:none;box-shadow:0 12px 32px rgba(18,61,184,.28)}" +
      ".draft-banner{position:sticky;top:0;z-index:1000;background:#b45309;color:#fff;font:700 13px/1.4 'DM Sans',system-ui,sans-serif;text-align:center;padding:8px 16px;letter-spacing:.02em}" +
      ".draft-tag{display:inline-block;margin-left:8px;padding:2px 7px;border-radius:4px;background:#b45309;color:#fff;font:700 11px/1.3 'DM Sans',system-ui,sans-serif;letter-spacing:.06em;vertical-align:middle;text-transform:uppercase}";
    document.head.appendChild(css);

    if (onUS && root.hasAttribute("data-draft-pricing")) {
      var banner = document.createElement("div");
      banner.className = "draft-banner";
      banner.setAttribute("role", "note");
      banner.textContent = "DRAFT USD PRICING — PENDING TIA APPROVAL. Not for public release.";
      document.body.insertBefore(banner, document.body.firstChild);
    }

    var bar = document.createElement("div");
    bar.className = "region-bar";
    var link = document.createElement("a");
    link.href = target;
    if (onUS) {
      bar.appendChild(document.createTextNode("Prices shown in US dollars."));
      link.textContent = "See the South Africa site →";
      link.addEventListener("click", function () { set("localStorage", KEY, "za"); });
    } else {
      bar.appendChild(document.createTextNode("Visiting from the US?"));
      link.textContent = "See our US pricing →";
      link.addEventListener("click", function () { set("localStorage", KEY, "us"); });
    }
    bar.appendChild(link);
    if (onUS) {
      var first = document.body.firstChild;
      var banner2 = document.querySelector(".draft-banner");
      document.body.insertBefore(bar, banner2 ? banner2.nextSibling : first);
    } else {
      document.body.appendChild(bar);
    }
  });
})();
