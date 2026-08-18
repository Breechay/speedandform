(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  var A = { other: [] };
  var qi = 0;
  var QN = 5;
  var BRICE = "briceikouebe@gmail.com";
  var sending = false;
  var plates = $("#plates");
  var filmA = $("#filmA");
  var filmB = $("#filmB");
  var beginSlot = $("#beginSlot");
  var plateCue = $("#plateCue");
  var lastPlate = 1;
  var activePlate = 0;
  var returnPlate = 0;
  var paintQueued = false;
  var H = 1;
  var last = {};
  var root = document.documentElement;
  var inst = document.querySelector(".inst");
  var workEl = null;
  var practiceEl = null;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pane(id) {
    $$(".pane").forEach(function (p) { p.classList.toggle("on", p.id === id); });
    var shown = id ? $("#" + id) : null;
    if (shown) shown.scrollTop = 0;
  }

  function mode(m) {
    document.body.classList.remove("asking", "reading");
    if (m) document.body.classList.add(m);
    if (m) {
      filmA.pause();
      filmB.pause();
    } else {
      syncFilms();
    }
  }

  function plateHeight() { return H; }

  function measure() {
    H = Math.max(1, plates.clientHeight);
    workEl = $(".hero-in");
    practiceEl = $(".practice-in");
  }

  function put(el, name, value) {
    var k = name + (el === root ? "" : "@" + (el.className || ""));
    if (last[k] === value) return;
    last[k] = value;
    el.style.setProperty(name, value);
  }

  function snapToPlate(i, behavior) {
    activePlate = clamp(i, 0, lastPlate);
    plates.scrollTo({ top: activePlate * H, behavior: behavior || (reduced ? "auto" : "smooth") });
    updatePlateState(activePlate);
  }

  function updatePlateState(i) {
    activePlate = clamp(i, 0, lastPlate);
    beginSlot.classList.toggle("quiet", activePlate === 1);
    if (plateCue) {
      $$("#plateCue [data-cue]").forEach(function (el) {
        var on = el.getAttribute("data-cue") === String(activePlate);
        el.classList.toggle("on", on);
        if (on) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    }
    syncFilms();
  }

  function keepFilm(el) {
    if (!el) return;
    el.muted = true;
    var go = el.play();
    if (go && go.catch) go.catch(function () {});
  }

  function syncFilms() {
    if (document.body.classList.contains("asking") || document.body.classList.contains("reading") || document.hidden) {
      filmA.pause();
      filmB.pause();
      return;
    }
    keepFilm(filmA);
    keepFilm(filmB);
  }

  function paintScroll() {
    var p01 = clamp(plates.scrollTop / H, 0, 1);

    // One true dissolve: B sits above A and fades in. A never moves, never dims.
    var cross = reduced ? (p01 > .5 ? 1 : 0) : ease(clamp((p01 - .06) / .70, 0, 1));
    put(root, "--film-b-opacity", cross.toFixed(3));
    put(root, "--hatch-opacity", lerp(.62, .34, cross).toFixed(3));

    if (workEl) {
      var leave = reduced ? (p01 > .5 ? 1 : 0) : ease(clamp(p01 / .46, 0, 1));
      put(workEl, "--work-opacity", (1 - leave).toFixed(3));
      put(workEl, "--work-y", (leave * -22).toFixed(1) + "px");
    }

    if (practiceEl) {
      var t = reduced ? (p01 > .5 ? 1 : 0) : ease(clamp((p01 - .38) / .50, 0, 1));
      var c = reduced ? t : ease(clamp((p01 - .46) / .50, 0, 1));
      var l = reduced ? t : ease(clamp((p01 - .56) / .44, 0, 1));
      put(practiceEl, "--practice-title-opacity", t.toFixed(3));
      put(practiceEl, "--practice-title-y", ((1 - t) * 20).toFixed(1) + "px");
      put(practiceEl, "--practice-copy-opacity", c.toFixed(3));
      put(practiceEl, "--practice-copy-y", ((1 - c) * 14).toFixed(1) + "px");
      put(practiceEl, "--practice-link-opacity", l.toFixed(3));
    }

    var nearest = p01 < .5 ? 0 : 1;
    if (nearest !== activePlate) updatePlateState(nearest);
    if (inst) inst.classList.toggle("moved", p01 > .04);
  }

  function showQ(i) {
    qi = Math.max(0, Math.min(QN - 1, i));
    $$(".q").forEach(function (q, j) { q.classList.toggle("on", j === qi); });
    $("#ticks").innerHTML = Array.from({ length: QN }, function (_, j) {
      return '<span class="tick ' + (j < qi ? "done" : j === qi ? "now" : "") + '">' + String(j + 1).padStart(2, "0") + "</span>";
    }).join("");
  }

  function start() {
    returnPlate = clamp(Math.round(plates.scrollTop / plateHeight()), 0, lastPlate);
    mode("asking");
    pane("p-ask");
    showQ(0);
  }

  $("#begin").addEventListener("click", start);
  $("#back").addEventListener("click", function () {
    if (qi === 0) {
      pane(null);
      mode(null);
      snapToPlate(returnPlate, "auto");
    } else showQ(qi - 1);
  });
  $("#editBtn").addEventListener("click", function () { mode("asking"); pane("p-ask"); showQ(0); });
  $("#restart").addEventListener("click", function () { pane(null); mode(null); snapToPlate(0, "auto"); });

  $$(".opts").forEach(function (box) {
    var key = box.dataset.key;
    var many = box.dataset.mode === "many";
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".opt");
      if (!b) return;
      if (many) {
        var none = b.textContent === "Nothing regularly";
        var turningOn = b.getAttribute("aria-pressed") !== "true";
        if (none) {
          $$('[data-key="other"] .opt').forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          if (turningOn) b.setAttribute("aria-pressed", "true");
        } else {
          $$('[data-key="other"] .opt').forEach(function (x) { if (x.textContent === "Nothing regularly") x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", turningOn ? "true" : "false");
        }
        A.other = $$('[data-key="other"] .opt[aria-pressed="true"]').map(function (x) { return x.textContent; });
        return;
      }
      $$('[data-key="' + key + '"] .opt').forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      A[key] = b.textContent;
      if (key === "goal") setTimeout(function () { showQ(1); }, 280);
    });
  });

  $$('[data-next]').forEach(function (b) {
    b.addEventListener("click", function () {
      if (qi === 3) A.issue = $("#issue").value.trim();
      if (qi === 4) {
        A.name = $("#nm").value.trim();
        A.mail = $("#em").value.trim();
        var need = $("#needMail");
        if (!/.+@.+\..+/.test(A.mail)) { need.hidden = false; $("#em").focus(); return; }
        need.hidden = true;
        build();
        mode("reading");
        pane("p-read");
        return;
      }
      showQ(qi + 1);
    });
  });

  $("#drop").addEventListener("click", function () { $("#pick").click(); });
  $("#pick").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    A.vid = f.name; A.file = f; $("#dropT").textContent = f.name; $("#drop").classList.add("has");
  });

  function offer() {
    var lift = A.other.indexOf("Strength") > -1 || A.other.indexOf("HYROX or mixed") > -1;
    var days = parseInt((A.days || "0").replace(/\D.*$/, ""), 10) || 0;
    return A.goal === "Balance running and lifting" || (lift && days >= 4);
  }

  function build() {
    var both = offer();
    $("#rKind").textContent = both ? "Run + Strength" : "Run Development";
    $("#rMoney").textContent = both ? "8 Weeks · $1,800" : "8 Weeks · $1,200";
    $("#rHead").textContent = A.name ? (A.name.split(" ")[0] + ", here is where you are.") : "Here is where you are.";
    var now = [];
    if (A.days) now.push(A.days + " days running");
    if (A.vol) now.push(/week/.test(A.vol) ? A.vol : A.vol + " a week");
    if (A.long) now.push("longest " + A.long.replace(" mi", "") + " mi");
    var other = A.other.filter(function (x) { return x !== "Nothing regularly"; });
    var rows = [];
    if (A.goal) rows.push(["You want to", A.goal.toLowerCase() + ".", ""]);
    if (now.length) rows.push(["Right now", now.join(" · "), other.length ? ("Also training: " + other.join(", ").toLowerCase()) : ""]);
    if (A.issue) rows.push(["The issue", '"' + A.issue + '"', "", true]);
    if (A.vid) rows.push(["Attached", A.vid, "Brice will watch it before he replies."]);
    if (both) rows.push(["Why both", "Running and lifting are already in the same week.", "One person writing both is the only way they stop taking from each other."]);
    if (A.city === "Miami") rows.push(["Miami", "Some key sessions can happen together.", "When seeing the work in person is worth more than reading about it."]);
    $("#rRows").innerHTML = rows.map(function (r, i) {
      return '<div class="row" style="animation-delay:' + (0.12 + i * 0.09) + 's"><label>' + r[0] + "</label><p" + (r[3] ? ' class="quote"' : "") + ">" + r[1] + "</p>" + (r[2] ? "<small>" + r[2] + "</small>" : "") + "</div>";
    }).join("");
  }

  function payload() {
    var both = offer();
    return { offer:both?"Run + Strength":"Run Development",price:both?"8 weeks · $1,800":"8 weeks · $1,200",goal:A.goal||"",days:A.days||"",volume:A.vol||"",longest:A.long||"",other:(A.other||[]).join(", "),issue:A.issue||"",city:A.city||"",name:A.name||"",email:A.mail||"","video-name":A.vid||"" };
  }

  function sendToBrice() {
    if (sending) return;
    sending = true;
    var btn = $("#sendBtn"), err = $("#sendErr"), data = payload();
    btn.disabled = true; err.hidden = true;
    var dest = (btn.getAttribute("data-send-to") || BRICE).trim() || BRICE;
    var mail = new FormData();
    mail.append("_subject", data.offer + " — " + (data.name || "new start")); mail.append("_template", "table"); mail.append("_captcha", "false");
    if (data.email) mail.append("_replyto", data.email);
    Object.keys(data).forEach(function (k) { mail.append(k, data[k]); }); if (A.file) mail.append("video", A.file);
    var netlify = new FormData(); netlify.append("form-name", "run-development"); Object.keys(data).forEach(function (k) { netlify.append(k, data[k]); }); if (A.file) netlify.append("video", A.file);
    var emailed = fetch("https://formsubmit.co/ajax/" + encodeURIComponent(dest), { method:"POST", body:mail, headers:{Accept:"application/json"} }).then(function (r) { return r.json().then(function (j) { return { ok:r.ok, j:j }; }); });
    var stored = fetch("/", { method:"POST", body:netlify }).catch(function () { return null; });
    Promise.all([emailed, stored]).then(function (res) {
      if (res[0] && res[0].ok) { pane("p-done"); return; }
      err.hidden = false; err.textContent = "It did not send. Check the address and try again."; btn.disabled = false; sending = false;
    }).catch(function () { err.hidden = false; err.textContent = "It did not send. Try again."; btn.disabled = false; sending = false; });
  }

  $("#sendBtn").addEventListener("click", sendToBrice);
  if (plateCue) {
    $$("#plateCue [data-cue]").forEach(function (el) {
      el.addEventListener("click", function () {
        var i = parseInt(el.getAttribute("data-cue"), 10);
        if (isNaN(i)) return;
        snapToPlate(i);
      });
    });
  }
  plates.addEventListener("scroll", function () {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(function () {
      paintQueued = false;
      paintScroll();
    });
  }, { passive: true });
  document.addEventListener("visibilitychange", function () { syncFilms(); });
  window.addEventListener("pageshow", function () { syncFilms(); });
  window.addEventListener("focus", function () { syncFilms(); });
  window.addEventListener("resize", function () {
    measure();
    last = {};
    if (!document.body.classList.contains("asking") && !document.body.classList.contains("reading")) snapToPlate(activePlate, "auto");
    paintScroll();
  });

  showQ(0);
  pane(null);
  measure();
  paintScroll();
  updatePlateState(0);
  keepFilm(filmA);
  keepFilm(filmB);
})();
