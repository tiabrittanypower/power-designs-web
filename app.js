const SITE_CONFIG = {
  // Google Appointments removed — book via contact form / WhatsApp
  bookingUrl: "",
  whatsappNumber: "0500504340",
  enquiryEmail: "powerdesignsweb@gmail.com",
  // FormSubmit delivers to Gmail without Netlify Forms detection
  formEndpoint: "https://formsubmit.co/ajax/powerdesignsweb@gmail.com",
  // Optional analytics — only load when non-empty
  gaMeasurementId: "", // e.g. "G-XXXXXXXXXX"
  metaPixelId: "" // e.g. "123456789012345"
};

/* ------------------------------------------------------------------ */
/* Attribution (UTM + channel) — works WITHOUT GA                      */
/* ------------------------------------------------------------------ */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const EXTRA_PARAM_KEYS = ["channel", "ref", "gclid", "fbclid"];
const FORM_ATTR_FIELDS = UTM_KEYS.concat([
  "channel",
  "gclid",
  "fbclid",
  "landing_page",
  "first_landing",
  "referrer"
]);
const FIRST_TOUCH_KEY = "pdw_first_touch";
const LAST_TOUCH_KEY = "pdw_last_touch";
const ATTR_MAX = 200;

const CHANNEL_LABELS = {
  marketplace: "Facebook Marketplace",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  outreach: "a personal message",
  instagram: "Instagram",
  google: "Google"
};

/** Root-relative prefix for pages under /blog/ or /go/ */
function siteRootPrefix() {
  const path = (location.pathname || "").replace(/\\/g, "/");
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "";
  const last = segments[segments.length - 1];
  // Drop file (*.html) or pretty-URL page leaf (/go/marketplace)
  if (/\.[a-z0-9]+$/i.test(last)) {
    segments.pop();
  } else if (segments.length >= 2) {
    segments.pop();
  }
  return segments.length ? "../".repeat(segments.length) : "";
}

/** Safe label for FormSubmit email subject */
function sanitizeChannelForSubject(channel) {
  const raw = String(channel || "").toLowerCase().trim();
  if (!raw) return "";
  const allowed = {
    marketplace: "marketplace",
    facebook: "facebook",
    whatsapp: "whatsapp",
    outreach: "outreach",
    instagram: "instagram",
    google: "google"
  };
  if (allowed[raw]) return allowed[raw];
  const cleaned = raw.replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return cleaned;
}

function clipAttr(value) {
  const text = String(value == null ? "" : value).trim();
  if (!text) return "";
  return text.slice(0, ATTR_MAX);
}

function readJsonStorage(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function writeJsonStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (_) {
    /* private mode / quota */
  }
}

function parseUrlAttribution() {
  const params = new URLSearchParams(location.search);
  const out = {};
  UTM_KEYS.concat(EXTRA_PARAM_KEYS).forEach(key => {
    const val = params.get(key);
    if (val) out[key] = clipAttr(val);
  });
  // Custom ref → channel when channel not set
  if (!out.channel && out.ref) {
    out.channel = out.ref;
  }
  return out;
}

function bodyDefaultChannel() {
  const body = document.body;
  if (!body) return "";
  return clipAttr(body.getAttribute("data-channel") || (body.dataset && body.dataset.channel) || "");
}

/** Seed from body data-utm-* / data-channel when URL has no marketing params */
function bodyDefaultAttribution() {
  const body = document.body;
  if (!body || !body.dataset) return {};
  const out = {};
  const channel = bodyDefaultChannel();
  if (channel) out.channel = channel;
  UTM_KEYS.forEach(key => {
    // data-utm-source → dataset.utmSource
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const val = body.dataset[camel];
    if (val) out[key] = clipAttr(val);
  });
  return out;
}

function hasMarketingSignal(attr) {
  if (!attr) return false;
  return UTM_KEYS.some(k => attr[k]) || Boolean(attr.channel || attr.ref || attr.gclid || attr.fbclid);
}

/**
 * On every page load:
 * - parse utm_* + channel/ref (+ gclid/fbclid)
 * - first-touch → localStorage pdw_first_touch (if empty)
 * - last-touch → sessionStorage pdw_last_touch
 * - body[data-channel] / data-utm-* fallback when no UTM/channel in URL
 */
function captureAttribution() {
  const fromUrl = parseUrlAttribution();
  const fromBody = bodyDefaultAttribution();
  const bodyChannel = bodyDefaultChannel();
  const attr = { ...fromUrl };

  // Fill gaps from body defaults (funnel landings)
  if (!hasMarketingSignal(attr) && hasMarketingSignal(fromBody)) {
    Object.assign(attr, fromBody);
  } else {
    if (!attr.channel && (fromBody.channel || bodyChannel)) {
      attr.channel = fromBody.channel || bodyChannel;
    }
    UTM_KEYS.forEach(k => {
      if (!attr[k] && fromBody[k]) attr[k] = fromBody[k];
    });
  }

  attr.landing_page = clipAttr(location.pathname) || "/";
  attr.ts = new Date().toISOString();

  try {
    if (document.referrer) {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== location.hostname) {
        attr.referrer = clipAttr(document.referrer);
      }
    }
  } catch (_) {
    /* ignore */
  }

  const shouldStore = hasMarketingSignal(attr) || Boolean(bodyChannel);

  if (shouldStore) {
    // Last-touch (session)
    writeJsonStorage(sessionStorage, LAST_TOUCH_KEY, attr);

    // First-touch (local) only if empty
    const existingFirst = readJsonStorage(localStorage, FIRST_TOUCH_KEY);
    if (!existingFirst) {
      const first = {
        ...attr,
        first_landing: attr.landing_page
      };
      writeJsonStorage(localStorage, FIRST_TOUCH_KEY, first);
    }
  }

  return getAttribution();
}

function getAttribution() {
  const last = readJsonStorage(sessionStorage, LAST_TOUCH_KEY);
  const first = readJsonStorage(localStorage, FIRST_TOUCH_KEY);
  const bodyChannel = bodyDefaultChannel();

  const base = last || first || {
    landing_page: location.pathname || "/",
    channel: bodyChannel || ""
  };

  // Enrich first_landing from first-touch when available
  if (first) {
    base.first_landing =
      first.first_landing || first.landing_page || base.landing_page || location.pathname || "/";
  } else if (!base.first_landing) {
    base.first_landing = base.landing_page || location.pathname || "/";
  }

  // Prefer last-touch channel, else first, else body
  if (!base.channel) {
    base.channel = (first && first.channel) || bodyChannel || "";
  }

  // Current page path as landing_page when filling form on contact
  if (!base.landing_page) {
    base.landing_page = location.pathname || "/";
  }

  return base;
}

function channelDisplayLabel(channel) {
  if (!channel) return "";
  const key = String(channel).toLowerCase();
  return CHANNEL_LABELS[key] || channel;
}

function buildFormSubject(attr) {
  const channel = sanitizeChannelForSubject((attr && attr.channel) || "");
  if (channel) {
    return `New website enquiry [${channel}] — Power Designs Web`;
  }
  return "New website enquiry — Power Designs Web";
}

function buildWhatsAppMessage(attr) {
  const channel = ((attr && attr.channel) || "").toLowerCase();
  if (channel === "marketplace") {
    return "Hi Tia, I found you via Facebook Marketplace and would like to discuss a website for my business.";
  }
  if (channel === "facebook") {
    return "Hi Tia, I found you on Facebook and would like to discuss a website for my business.";
  }
  if (channel === "whatsapp") {
    return "Hi Tia, thanks for the WhatsApp link — I would like to discuss a website for my business.";
  }
  if (channel === "outreach") {
    return "Hi Tia, I got your message and would like to discuss a website for my business.";
  }
  if (channel) {
    const label = channelDisplayLabel(channel);
    return `Hi Tia, I found you via ${label} and would like to discuss a website for my business.`;
  }
  return "Hi Tia, I would like to discuss a website for my business.";
}

function ensureHiddenField(form, name, value) {
  let input = form.querySelector(`input[type="hidden"][name="${name}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value == null ? "" : String(value);
  return input;
}

function applyAttributionToForm(form) {
  if (!form) return;
  const attr = getAttribution();
  FORM_ATTR_FIELDS.forEach(name => {
    let value = attr[name] || "";
    if (name === "landing_page" && !value) value = location.pathname || "/";
    if (name === "first_landing" && !value) {
      value = attr.landing_page || location.pathname || "/";
    }
    ensureHiddenField(form, name, value);
  });
}

/* ------------------------------------------------------------------ */
/* Optional GA4 + Meta Pixel                                           */
/* ------------------------------------------------------------------ */

function loadGoogleAnalytics(measurementId) {
  const id = String(measurementId || "").trim();
  if (!id || window.gtag) return;
  if (!/^G-[A-Z0-9]+$/i.test(id)) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());

  const attr = getAttribution();
  gtag("config", id, {
    send_page_view: true,
    campaign_source: attr.utm_source || undefined,
    campaign_medium: attr.utm_medium || undefined,
    campaign_name: attr.utm_campaign || undefined,
    campaign_content: attr.utm_content || undefined,
    campaign_term: attr.utm_term || undefined
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId) {
  const id = String(pixelId || "").trim();
  if (!id || window.fbq) return;

  /* Meta base pixel */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", id);
  window.fbq("track", "PageView");
}

function trackEvent(name, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params || {});
  }
}

function trackLead(attr) {
  const params = {
    channel: (attr && attr.channel) || "",
    utm_source: (attr && attr.utm_source) || "",
    utm_medium: (attr && attr.utm_medium) || "",
    utm_campaign: (attr && attr.utm_campaign) || ""
  };
  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", params);
  }
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", params);
  }
}

// Capture attribution early, then optionally load trackers
const pageAttribution = captureAttribution();

if (SITE_CONFIG.gaMeasurementId) {
  loadGoogleAnalytics(SITE_CONFIG.gaMeasurementId);
}
if (SITE_CONFIG.metaPixelId) {
  loadMetaPixel(SITE_CONFIG.metaPixelId);
}

/* ------------------------------------------------------------------ */
/* Nav / mobile menu                                                   */
/* ------------------------------------------------------------------ */

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navHome = nav ? nav.parentElement : null;
let menuJustToggled = false;
let menuScrollY = 0;

function isMobileNav() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function setMenuOpen(open) {
  if (!toggle || !nav) return;
  const willOpen = Boolean(open);

  // On mobile, park the panel on <body> so fixed positioning uses the viewport
  // (not a sticky/header containing block). Restore into the header on close/desktop.
  if (willOpen && isMobileNav() && nav.parentElement !== document.body) {
    document.body.appendChild(nav);
  }
  if (!willOpen && navHome && nav.parentElement !== navHome) {
    navHome.appendChild(nav);
  }

  nav.classList.toggle("open", willOpen);
  toggle.setAttribute("aria-expanded", String(willOpen));
  toggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("menu-open", willOpen);

  // Lock background scroll on iOS
  if (willOpen) {
    menuScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  } else {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, menuScrollY);
  }
}

if (toggle && nav) {
  if (!toggle.getAttribute("type")) toggle.setAttribute("type", "button");

  const onToggle = event => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(!nav.classList.contains("open"));
    menuJustToggled = true;
    window.setTimeout(() => {
      menuJustToggled = false;
    }, 350);
  };

  toggle.addEventListener("click", onToggle);

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  // Ignore the opening tap / ghost click so the menu does not instantly close
  document.addEventListener(
    "click",
    event => {
      if (!nav.classList.contains("open") || menuJustToggled) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenuOpen(false);
    },
    true
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) setMenuOpen(false);
  });
}

const pageName = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".site-nav a[data-page]").forEach(link => {
  if (link.dataset.page === pageName) link.classList.add("active");
});

const rootPrefix = siteRootPrefix();

// "Book a free call" → contact enquiry form (Google Appointments not in use)
document.querySelectorAll("[data-booking]").forEach(link => {
  link.href = `${rootPrefix}contact.html#enquiry`;
  link.removeAttribute("target");
  link.removeAttribute("rel");
  link.title = "Send an enquiry or chat about a free website call";
});

document.querySelectorAll("[data-whatsapp]").forEach(button => {
  if (SITE_CONFIG.whatsappNumber) {
    button.disabled = false;
    button.addEventListener("click", () => {
      const attr = getAttribution();
      const custom = button.getAttribute("data-whatsapp-message");
      const text = custom || buildWhatsAppMessage(attr);
      const message = encodeURIComponent(text);
      trackEvent("whatsapp_click", {
        channel: attr.channel || "",
        event_label: button.getAttribute("data-track") || "whatsapp"
      });
      window.open(
        `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`,
        "_blank",
        "noopener"
      );
    });
  } else {
    button.disabled = true;
    button.title = "Chat to Power Designs Web on WhatsApp";
  }
});

// Static WhatsApp anchor links — personalise when channel known (skip if already customised)
document.querySelectorAll('a[href*="wa.me"]').forEach(anchor => {
  try {
    const url = new URL(anchor.href, location.href);
    if (!url.hostname.includes("wa.me")) return;
    const attr = getAttribution();
    if (!attr.channel) return;
    const existing = url.searchParams.get("text") || "";
    const decoded = existing ? decodeURIComponent(existing.replace(/\+/g, " ")) : "";
    if (/found you via|thanks for the whatsapp|got your message/i.test(decoded)) return;
    url.searchParams.set("text", buildWhatsAppMessage(attr));
    anchor.href = url.toString();
  } catch (_) {
    /* ignore malformed */
  }
});

// Click tracking for [data-track]
document.querySelectorAll("[data-track]").forEach(el => {
  el.addEventListener("click", () => {
    const label = el.getAttribute("data-track") || "click";
    const attr = getAttribution();
    trackEvent(label, {
      event_category: "engagement",
      event_label: label,
      channel: attr.channel || ""
    });
  });
});

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 })
  : null;

document.querySelectorAll(".reveal").forEach(item => {
  if (revealObserver) revealObserver.observe(item);
  else item.classList.add("visible");
});

const enquiryForm = document.querySelector("#enquiry-form");
if (enquiryForm) {
  const status = document.querySelector("#form-status") || document.querySelector(".form-status");
  const submitBtn = document.querySelector("#enquiry-submit") || enquiryForm.querySelector('[type="submit"]');
  const params = new URLSearchParams(location.search);
  const requestedPackage = params.get("package");

  // Re-capture if contact was opened with UTMs, then fill hidden fields
  captureAttribution();
  applyAttributionToForm(enquiryForm);

  if (requestedPackage) {
    const packageSelect = enquiryForm.querySelector("#package");
    if (packageSelect) {
      const matchingOption = [...packageSelect.options].find(option =>
        option.value.startsWith(requestedPackage) || option.text.startsWith(requestedPackage)
      );
      if (matchingOption) packageSelect.value = matchingOption.value;
    }
  }

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("error", "success");
    if (type) status.classList.add(type);
    status.classList.add("show");
  }

  function whatsappFallbackLink() {
    const attr = getAttribution();
    const wa = SITE_CONFIG.whatsappNumber
      ? `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage(attr))}`
      : "https://wa.me/0500504340";
    if (status && !status.querySelector("a.wa-fallback")) {
      status.appendChild(document.createElement("br"));
      const link = document.createElement("a");
      link.href = wa;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "blue wa-fallback";
      link.style.display = "inline-block";
      link.style.marginTop = "8px";
      link.textContent = "Open WhatsApp instead";
      status.appendChild(link);
    }
  }

  enquiryForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;

    applyAttributionToForm(enquiryForm);
    const attr = getAttribution();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    setStatus("Sending your enquiry…", null);

    try {
      const formData = new FormData(enquiryForm);
      formData.set("_subject", buildFormSubject(attr));
      formData.set("_template", "table");
      formData.set("_captcha", "false");

      const response = await fetch(SITE_CONFIG.formEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      const result = await response.json().catch(() => ({}));
      const successFlag = result.success === true || result.success === "true";
      const failFlag = result.success === false || result.success === "false";
      const msg = (result.message || "").toString();

      // First-time FormSubmit setup: activation email sent to business inbox
      if (failFlag && /activat/i.test(msg)) {
        setStatus(
          "Almost there: FormSubmit emailed powerdesignsweb@gmail.com an “Activate Form” link. Open that email (check Spam), click Activate, then submit the form again. Until then, use WhatsApp 0500504340.",
          "error"
        );
        whatsappFallbackLink();
        return;
      }

      if (!response.ok || failFlag) {
        throw new Error(msg || `Form submit failed (${response.status})`);
      }

      if (!successFlag && !msg) {
        throw new Error("Unexpected response from form service");
      }

      trackLead(attr);

      setStatus(
        "Thank you — your enquiry was sent to our inbox. We will reply as soon as possible. You can also WhatsApp 0500504340 or book a free call.",
        "success"
      );
      enquiryForm.reset();
      applyAttributionToForm(enquiryForm);
      enquiryForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      console.error(error);
      setStatus(
        "We could not send the form just now. Please WhatsApp 0500504340 or email powerdesignsweb@gmail.com.",
        "error"
      );
      whatsappFallbackLink();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send enquiry →";
      }
    }
  });
}

document.querySelectorAll("[data-year]").forEach(item => {
  item.textContent = new Date().getFullYear();
});
