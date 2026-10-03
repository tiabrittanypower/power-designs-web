(function () {
  "use strict";

  var D = window.DESTINATIONS, INTERESTS = window.INTERESTS, STYLES = window.STYLES;
  var STORE_KEY = "travelAgent.trips.v1";
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Storage (wrapped: can throw in private mode) ----------
  function loadTrips() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveTrips(t) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(t)); } catch (e) { /* ignore */ }
  }

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function parseDate(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(d) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000) + 1; }
  function matchDestination(q) {
    q = q.trim().toLowerCase();
    if (!q) return null;
    var keys = Object.keys(D);
    for (var i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === q) return keys[i];
    for (var j = 0; j < keys.length; j++) {
      if (keys[j].toLowerCase().indexOf(q) !== -1 || q.indexOf(keys[j].toLowerCase()) !== -1) return keys[j];
    }
    return null;
  }

  // ---------- Planning engine ----------
  function buildPlan(input) {
    var dest = D[input.destination];
    var days = input.days;
    var style = STYLES[input.style];
    var picks = input.interests.length ? input.interests : INTERESTS.map(function (i) { return i.id; });

    // Round-robin through chosen interests so each day mixes themes without repeats.
    var pools = {};
    picks.forEach(function (k) { pools[k] = dest.activities[k].slice(); });
    var used = {}, cursor = 0, total = 0;
    picks.forEach(function (k) { total += pools[k].length; });

    function next() {
      for (var tries = 0; tries < picks.length; tries++) {
        var k = picks[cursor++ % picks.length];
        var item = pools[k].shift();
        if (item) { used[item] = 1; return { text: item, theme: k }; }
      }
      // Pools exhausted: recycle with a free-time slot.
      return { text: "Free time to revisit a favourite spot", theme: "relax" };
    }

    var itinerary = [];
    for (var d = 0; d < days; d++) {
      var date = new Date(parseDate(input.start).getTime() + d * 86400000);
      var title = d === 0 ? "Arrive & settle in" : d === days - 1 && days > 1 ? "Final day & departure" : "Explore";
      var slots = d === 0
        ? [{ when: "Afternoon", item: next() }, { when: "Evening", item: { text: "Easy dinner near your accommodation", theme: "food" } }]
        : d === days - 1 && days > 1
          ? [{ when: "Morning", item: next() }, { when: "Afternoon", item: { text: "Last-minute souvenirs, then head to the airport", theme: "relax" } }]
          : [{ when: "Morning", item: next() }, { when: "Afternoon", item: next() }, { when: "Evening", item: next() }];
      itinerary.push({ day: d + 1, date: fmtDate(date), title: title, slots: slots });
    }

    // Budget (per person, scaled by style), then total for party.
    var lodgingNights = Math.max(days - 1, 1);
    var lodgingPerRoom = dest.daily.lodging * style.mult;
    var rooms = Math.ceil(input.travelers / 2);
    var costs = {
      Accommodation: lodgingPerRoom * lodgingNights * rooms,
      Food: dest.daily.food * style.mult * days * input.travelers,
      "Local transport": dest.daily.transport * style.mult * days * input.travelers,
      "Activities & entry": 35 * style.mult * days * input.travelers
    };
    var sum = 0;
    Object.keys(costs).forEach(function (k) { sum += costs[k]; });
    var buffer = sum * 0.1;
    costs["Contingency (10%)"] = buffer;
    sum += buffer;

    return {
      input: input, itinerary: itinerary, costs: costs, total: sum,
      perPerson: sum / input.travelers,
      budgetStatus: input.budget ? (sum <= input.budget ? "ok" : "over") : "none",
      packing: packingList(dest, input, days),
      id: Date.now().toString(36)
    };
  }

  function packingList(dest, input, days) {
    var list = ["Passport (valid 6+ months) & visa check", "Travel insurance documents", "Phone, charger & power adapter", "Bank cards + a little local cash (" + dest.currency + ")", "Medications & basic first-aid", "Comfortable walking shoes", days + " days of clothes (plan to rewash after 5)"];
    var i = input.interests;
    if (i.indexOf("nature") !== -1 || i.indexOf("adventure") !== -1) list.push("Daypack, reusable bottle, sunscreen, rain jacket");
    if (i.indexOf("culture") !== -1) list.push("Modest clothing for temples/churches; scarf or light layer");
    if (i.indexOf("relax") !== -1) list.push("Swimwear");
    if (i.indexOf("food") !== -1) list.push("Stomach remedies; a tote for market finds");
    if (input.style === "luxury") list.push("One smart-casual outfit for fine dining");
    return list;
  }

  // ---------- Rendering ----------
  var current = null;

  function renderPlan(plan) {
    current = plan;
    var dest = D[plan.input.destination], inp = plan.input;
    var html = "";
    html += '<div class="plan-head"><div class="big-emoji" aria-hidden="true">' + dest.emoji + '</div><div>' +
      "<h2>" + esc(inp.destination) + ", " + esc(dest.country) + "</h2>" +
      '<p class="muted">' + esc(fmtDate(parseDate(inp.start))) + " – " + esc(fmtDate(parseDate(inp.end))) + " · " + inp.days + " days · " +
      inp.travelers + " traveler" + (inp.travelers > 1 ? "s" : "") + " · " + esc(STYLES[inp.style].label) + "</p>" +
      '<p class="muted">Best time to visit: ' + esc(dest.best) + "</p></div></div>";

    html += '<div class="actions">' +
      '<button class="btn" id="saveBtn" type="button">💾 Save trip</button>' +
      '<button class="btn ghost" id="printBtn" type="button">🖨️ Print / PDF</button>' +
      '<button class="btn ghost" id="copyBtn" type="button">📋 Copy itinerary</button></div>';

    html += "<h3>Itinerary</h3>";
    plan.itinerary.forEach(function (d) {
      html += '<article class="day"><header><span class="day-no">Day ' + d.day + "</span><strong>" + esc(d.title) + '</strong><span class="muted">' + esc(d.date) + "</span></header><ul>";
      d.slots.forEach(function (s) {
        var ic = (INTERESTS.filter(function (x) { return x.id === s.item.theme; })[0] || {}).icon || "📍";
        html += "<li><span class=\"when\">" + s.when + "</span><span>" + ic + " " + esc(s.item.text) + "</span></li>";
      });
      html += "</ul></article>";
    });

    html += "<h3>Estimated budget</h3>";
    var max = Math.max.apply(null, Object.keys(plan.costs).map(function (k) { return plan.costs[k]; }));
    html += '<div class="budget">';
    Object.keys(plan.costs).forEach(function (k) {
      var v = plan.costs[k];
      html += '<div class="bar-row"><span>' + esc(k) + '</span><div class="bar"><i style="width:' + Math.max(4, v / max * 100) + '%"></i></div><b>' + money(v) + "</b></div>";
    });
    html += '<div class="total"><span>Total (excl. flights)</span><strong>' + money(plan.total) + "</strong></div>" +
      '<div class="muted">≈ ' + money(plan.perPerson) + " per person</div>";
    if (plan.budgetStatus === "ok") html += '<p class="badge ok">✅ Within your ' + money(inp.budget) + " budget (" + money(inp.budget - plan.total) + " spare)</p>";
    if (plan.budgetStatus === "over") html += '<p class="badge over">⚠️ ' + money(plan.total - inp.budget) + " over your " + money(inp.budget) + " budget — try Budget style or fewer days.</p>";
    html += '<p class="muted small">Rough mid-range estimates in USD. Check live flight and hotel prices before booking.</p></div>';

    html += "<h3>Local tips</h3><ul class=\"bullets\">" + dest.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
    html += "<h3>Packing checklist</h3><ul class=\"checks\">" + plan.packing.map(function (p, i) {
      return '<li><label><input type="checkbox" data-pack="' + i + '"> ' + esc(p) + "</label></li>";
    }).join("") + "</ul>";

    $("plan").innerHTML = html;
    $("plan").hidden = false;
    $("empty").hidden = true;
    $("saveBtn").onclick = saveCurrent;
    $("printBtn").onclick = function () { window.print(); };
    $("copyBtn").onclick = copyCurrent;
    $("plan").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function planText(p) {
    var lines = [p.input.destination + " — " + p.input.days + " days", ""];
    p.itinerary.forEach(function (d) {
      lines.push("Day " + d.day + " (" + d.date + "): " + d.title);
      d.slots.forEach(function (s) { lines.push("  " + s.when + ": " + s.item.text); });
    });
    lines.push("", "Estimated total: " + money(p.total) + " (excl. flights)");
    return lines.join("\n");
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function copyCurrent() {
    var text = planText(current);
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("Itinerary copied"); }, function () { toast("Copy failed"); });
    else toast("Copy not supported here");
  }

  function saveCurrent() {
    var trips = loadTrips();
    if (trips.some(function (t) { return t.id === current.id; })) { toast("Already saved"); return; }
    trips.unshift(current);
    saveTrips(trips);
    renderSaved();
    toast("Trip saved");
  }

  function renderSaved() {
    var trips = loadTrips(), box = $("saved");
    if (!trips.length) { box.innerHTML = '<p class="muted small">No saved trips yet.</p>'; return; }
    box.innerHTML = trips.map(function (t) {
      return '<div class="saved-item"><button type="button" class="open" data-id="' + esc(t.id) + '">' +
        D[t.input.destination].emoji + " " + esc(t.input.destination) + '<small>' + t.input.days + " days · " + money(t.total) + "</small></button>" +
        '<button type="button" class="del" data-del="' + esc(t.id) + '" aria-label="Delete trip to ' + esc(t.input.destination) + '">✕</button></div>';
    }).join("");
  }

  // ---------- Form wiring ----------
  function init() {
    var dl = $("destList");
    dl.innerHTML = Object.keys(D).map(function (k) { return '<option value="' + esc(k) + '">'; }).join("");
    $("interests").innerHTML = INTERESTS.map(function (i) {
      return '<label class="chip"><input type="checkbox" name="interest" value="' + i.id + '"><span>' + i.icon + " " + i.label + "</span></label>";
    }).join("");
    $("quick").innerHTML = Object.keys(D).map(function (k) {
      return '<button type="button" class="pill" data-dest="' + esc(k) + '">' + D[k].emoji + " " + esc(k) + "</button>";
    }).join("");

    var today = new Date(), iso = function (d) { return d.toISOString().slice(0, 10); };
    var start = new Date(today.getTime() + 30 * 86400000), end = new Date(start.getTime() + 4 * 86400000);
    $("start").min = iso(today); $("start").value = iso(start); $("end").value = iso(end);

    $("quick").addEventListener("click", function (e) {
      var b = e.target.closest("[data-dest]"); if (b) { $("destination").value = b.dataset.dest; $("destination").focus(); }
    });
    $("start").addEventListener("change", function () { if ($("end").value < $("start").value) $("end").value = $("start").value; $("end").min = $("start").value; });

    $("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("error"); err.textContent = "";
      var key = matchDestination($("destination").value);
      if (!key) { err.textContent = "I don't have that destination yet. Pick one of: " + Object.keys(D).join(", ") + "."; return; }
      var days = daysBetween($("start").value, $("end").value);
      if (!(days >= 1 && days <= 21)) { err.textContent = "Trips must be between 1 and 21 days, with the end date on or after the start."; return; }
      var interests = Array.prototype.map.call(document.querySelectorAll('input[name="interest"]:checked'), function (c) { return c.value; });
      renderPlan(buildPlan({
        destination: key, start: $("start").value, end: $("end").value, days: days,
        travelers: Math.max(1, Math.min(10, +$("travelers").value || 1)),
        style: $("style").value, interests: interests, budget: +$("budget").value || 0
      }));
    });

    $("saved").addEventListener("click", function (e) {
      var o = e.target.closest("[data-id]"), d = e.target.closest("[data-del]");
      if (o) { var t = loadTrips().filter(function (x) { return x.id === o.dataset.id; })[0]; if (t) renderPlan(t); }
      if (d) { saveTrips(loadTrips().filter(function (x) { return x.id !== d.dataset.del; })); renderSaved(); }
    });

    renderSaved();
  }

  init();
})();
