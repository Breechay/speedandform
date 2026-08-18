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
  var snapTimer = 0;
  var snapLock = false;
  var paintQueued = false;
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

  function plateHeight() { return Math.max(1, plates.clientHeight); }

  function snapToPlate(i, behavior) {
    activePlate = clamp(i, 0, lastPlate);
    snapLock = true;
    plates.scrollTo({ top: activePlate * plateHeight(), behavior: behavior || (reduced ? "auto" : "smooth") });
    window.setTimeout(function () { snapLock = false; }, reduced ? 30 : 520);
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
    var h = plateHeight();
    var p = plates.scrollTop / h;
    var p01 = clamp(p, 0, 1);

    var aOut = reduced ? (p01 > .5 ? 1 : 0) : ease(clamp((p01 - .1) / .68, 0, 1));
    var bIn = reduced ? (p01 > .5 ? 1 : 0) : ease(clamp(p01 / .55, 0, 1));

    document.documentElement.style.setProperty("--film-a-opacity", (1 - aOut).toFixed(3));
    document.documentElement.style.setProperty("--film-b-opacity", bIn.toFixed(3));
    document.documentElement.style.setProperty("--film-a-scale", reduced ? "1" : lerp(1, 1.012, aOut).toFixed(4));
    document.documentElement.style.setProperty("--film-b-scale", "1");
    document.documentElement.style.setProperty("--film-b-sat", "1");
    document.documentElement.style.setProperty("--film-b-bright", "1");
    document.documentElement.style.setProperty("--room-dark", ".02");
    document.documentElement.style.setProperty("--hatch-opacity", lerp(.62, .34, bIn).toFixed(3));
    document.documentElement.style.setProperty("--hatch-y", "0px");

    var work = $(".hero-in");
    if (work) {
      var workLeave = ease(clamp(p01 / .48, 0, 1));
      work.style.setProperty("--work-opacity", (1 - workLeave).toFixed(3));
      work.style.setProperty("--work-y", (workLeave * -16).toFixed(1) + "px");
    }

    var practiceIn = $(".practice-in");
    if (practiceIn) {
      var arrive = ease(clamp((p01 - .34) / .48, 0, 1));
      practiceIn.style.setProperty("--practice-title-opacity", arrive.toFixed(3));
      practiceIn.style.setProperty("--practice-title-y", ((1 - arrive) * 18).toFixed(1) + "px");
      var copyArrive = ease(clamp((p01 - .48) / .44, 0, 1));
      practiceIn.style.setProperty("--practice-copy-opacity", copyArrive.toFixed(3));
      practiceIn.style.setProperty("--practice-copy-y", ((1 - copyArrive) * 14).toFixed(1) + "px");
      var linkArrive = ease(clamp((p01 - .6) / .38, 0, 1));
      practiceIn.style.setProperty("--practice-link-opacity", linkArrive.toFixed(3));
    }

    var nearest = clamp(Math.round(p), 0, lastPlate);
    if (nearest !== activePlate && Math.abs(p - nearest) < .38) updatePlateState(nearest);

    window.clearTimeout(snapTimer);
    if (!snapLock && !reduced) {
      snapTimer = window.setTimeout(function () {
        if (document.body.classList.contains("asking") || document.body.classList.contains("reading")) return;
        var target = clamp(Math.round(plates.scrollTop / plateHeight()), 0, lastPlate);
        var dist = Math.abs(plates.scrollTop - target * plateHeight());
        if (dist > 2) snapToPlate(target, "smooth");
        else updatePlateState(target);
      }, 90);
    }
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
    if (!document.body.classList.contains("asking") && !document.body.classList.contains("reading")) snapToPlate(activePlate, "auto");
    paintScroll();
  });

  showQ(0);
  pane(null);
  paintScroll();
  updatePlateState(0);
  keepFilm(filmA);
  keepFilm(filmB);
})();
