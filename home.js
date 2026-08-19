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
  var lastPlate = 3;
  var activePlate = 0;
  var returnPlate = 0;
  var paintQueued = false;
  var H = 1;
  var last = {};
  var root = document.documentElement;
  var inst = document.querySelector(".inst");
  var workEl = null;
  var practiceEl = null;
  var instrumentEl = null;
  var askEl = null;
  var thesis = $("#thesis");
  var argEls = $$(".arg");
  var argNow = $("#argNow");
  var ai = 0;
  var sessEls = $$(".session");
  var sessI = 0;
  var sessTimer = 0;
  var SESS_MS = 7000; /* a session holds long enough to be read, not watched */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AUTO_MS = 9000;          // dwell before the page shows you there is more
  var AUTO_ONCE = true;        // false = keep advancing like a carousel
  var autoTimer = 0;
  var touched = false;
  var qTimer = 0;
  var reloadAt = { a: 0, b: 0 };
  var filmBReady = false;

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
    instrumentEl = $(".instrument-in");
    askEl = $(".ask-in");
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
    beginSlot.classList.toggle("quiet", activePlate > 0);
    if (activePlate === 1) armAuto(); else window.clearTimeout(autoTimer);
    if (activePlate === 2) armSess(); else window.clearTimeout(sessTimer);
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
    el.playsInline = true;
    var go = el.play();
    if (go && go.catch) go.catch(function () {});
  }

  // Only reload a film that has genuinely lost its source. readyState 0 during
  // the first buffer is normal; calling load() there aborts the fetch and starts over.
  function reviveFilm(el, key) {
    if (!el) return;
    var dead = el.error || el.networkState === 3; // NETWORK_NO_SOURCE
    if (!dead) return;
    var now = Date.now();
    if (now - reloadAt[key] < 8000) return;
    reloadAt[key] = now;
    try { el.load(); } catch (e) {}
  }

  function filmsShouldRun() {
    return !document.hidden
      && !document.body.classList.contains("asking")
      && !document.body.classList.contains("reading");
  }

  function syncFilms() {
    if (!filmsShouldRun()) {
      filmA.pause();
      filmB.pause();
      return;
    }
    keepFilm(filmA);
    if (filmBReady) keepFilm(filmB);
  }

  // Backgrounding Safari, switching apps, or restoring from bfcache all leave the
  // element .paused with no event fired. Poll cheaply and only while we should be running.
  window.setInterval(function () {
    if (!filmsShouldRun()) return;
    if (filmA.paused && filmA.readyState > 1) keepFilm(filmA);
    if (filmBReady && filmB.paused && filmB.readyState > 1) keepFilm(filmB);
    reviveFilm(filmA, "a");
    if (filmBReady) reviveFilm(filmB, "b");
  }, 1500);

  [filmA, filmB].forEach(function (v) {
    ["pause", "ended"].forEach(function (ev) {
      v.addEventListener(ev, function () {
        if (!filmsShouldRun() || v.readyState <= 1) return;
        if (v === filmB && !filmBReady) return;
        window.setTimeout(function () { keepFilm(v); }, 60);
      });
    });
  });

  // 01 gets the pipe to itself. 02 starts fetching only once 01 can actually play.
  function releaseSecondFilm() {
    if (filmBReady) return;
    filmBReady = true;
    filmB.setAttribute("preload", "auto");
    if (filmsShouldRun()) keepFilm(filmB);
  }
  if (filmA.readyState >= 3) releaseSecondFilm();
  else {
    filmA.addEventListener("canplay", releaseSecondFilm, { once: true });
    window.setTimeout(releaseSecondFilm, 4000);
  }

  function showArg(n, dir) {
    var next = clamp(n, 0, argEls.length - 1);
    if (next === ai) return;
    var leaving = argEls[ai];
    ai = next;
    argEls.forEach(function (el, j) {
      var on = j === ai;
      el.classList.toggle("on", on);
      el.classList.remove("out");
      if (on) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
    if (leaving && dir !== 0 && !reduced) {
      leaving.classList.add("out");
      window.setTimeout(function () { leaving.classList.remove("out"); }, 600);
    }
    if (argNow) argNow.textContent = String(ai + 1).padStart(2, "0");
  }

  function stopAuto() {
    touched = true;
    window.clearTimeout(autoTimer);
  }

  function armAuto() {
    window.clearTimeout(autoTimer);
    if (touched || reduced || !thesis) return;
    if (activePlate !== 1) return;
    autoTimer = window.setTimeout(function () {
      if (touched || activePlate !== 1) return;
      if (document.body.classList.contains("asking") || document.body.classList.contains("reading")) return;
      showArg(ai + 1 > argEls.length - 1 ? 0 : ai + 1, 1);
      if (!AUTO_ONCE) armAuto();
    }, AUTO_MS);
  }

  function wireThesis() {
    if (!thesis) return;
    var x0 = 0, y0 = 0, live = false, axis = 0, moved = 0;

    thesis.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      x0 = e.clientX; y0 = e.clientY; live = true; axis = 0; moved = 0;
    });

    thesis.addEventListener("pointermove", function (e) {
      if (!live) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      moved = Math.max(moved, Math.abs(dx), Math.abs(dy));
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 1 : -1;
        if (axis === 1 && thesis.setPointerCapture) { try { thesis.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      if (axis !== 1) return;
      if (Math.abs(dx) < 32) return;
      live = false;
      stopAuto();
      showArg(ai + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });

    thesis.addEventListener("pointerup", function (e) {
      var wasLive = live;
      live = false; axis = 0;
      if (!wasLive || moved > 8) return;
      if (e.target.closest && e.target.closest("a")) return;
      stopAuto();
      showArg(ai + 1 > argEls.length - 1 ? 0 : ai + 1, 1);
    });

    thesis.addEventListener("pointercancel", function () { live = false; axis = 0; });

    var count = $("#argCount");
    if (count) count.addEventListener("click", function () {
      stopAuto();
      showArg(ai + 1 > argEls.length - 1 ? 0 : ai + 1, 1);
    });

    thesis.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      stopAuto();
      showArg(ai + (e.key === "ArrowRight" ? 1 : -1), e.key === "ArrowRight" ? 1 : -1);
    });
  }

  function paintScroll() {
    var p = clamp(plates.scrollTop / H, 0, lastPlate);
    var a = clamp(p, 0, 1);              // 01 -> 02
    var b = clamp(p - 1, 0, 1);          // 02 -> 03 instrument
    var c = clamp(p - 2, 0, 1);          // 03 -> 04 question

    var cross1 = reduced ? (a > .5 ? 1 : 0) : ease(clamp((a - .06) / .70, 0, 1));
    var crossW = reduced ? (b > .5 ? 1 : 0) : ease(clamp((b - .06) / .70, 0, 1));
    var crossQ = reduced ? (c > .5 ? 1 : 0) : ease(clamp((c - .06) / .70, 0, 1));
    var paper = Math.max(0, Math.min(1, crossW * (1 - crossQ)));
    put(root, "--film-b-opacity", cross1.toFixed(3));
    put(root, "--paper-enter", paper.toFixed(3));
    put(root, "--room-dim", crossQ.toFixed(3));
    put(root, "--hatch-opacity", (lerp(.62, .28, Math.max(cross1, crossQ * .4)) * (1 - paper)).toFixed(3));

    if (workEl) {
      var leave = reduced ? (a > .5 ? 1 : 0) : ease(clamp(a / .46, 0, 1));
      put(workEl, "--work-opacity", (1 - leave).toFixed(3));
      put(workEl, "--work-y", (leave * -22).toFixed(1) + "px");
    }

    if (practiceEl) {
      var t = reduced ? (a > .5 ? 1 : 0) : ease(clamp((a - .38) / .50, 0, 1));
      var copy = reduced ? t : ease(clamp((a - .46) / .50, 0, 1));
      var l = reduced ? t : ease(clamp((a - .56) / .44, 0, 1));
      var gone = reduced ? (b > .5 ? 1 : 0) : ease(clamp(b / .46, 0, 1));
      put(practiceEl, "--practice-title-opacity", (t * (1 - gone)).toFixed(3));
      put(practiceEl, "--practice-title-y", ((1 - t) * 20 - gone * 22).toFixed(1) + "px");
      put(practiceEl, "--practice-copy-opacity", (copy * (1 - gone)).toFixed(3));
      put(practiceEl, "--practice-copy-y", ((1 - copy) * 14 - gone * 22).toFixed(1) + "px");
      put(practiceEl, "--practice-link-opacity", (l * (1 - gone)).toFixed(3));
    }

    if (askEl) {
      var at = reduced ? (c > .5 ? 1 : 0) : ease(clamp((c - .38) / .50, 0, 1));
      var ao = reduced ? at : ease(clamp((c - .50) / .46, 0, 1));
      put(askEl, "--ask-title-opacity", at.toFixed(3));
      put(askEl, "--ask-title-y", ((1 - at) * 20).toFixed(1) + "px");
      put(askEl, "--ask-opts-opacity", ao.toFixed(3));
      put(askEl, "--ask-opts-y", ((1 - ao) * 14).toFixed(1) + "px");
    }

    var dial = $("#dial");
    var disc = $("#disc");
    if (dial && disc && !reduced) {
      var over = Math.max(0, (p - 2) * H);
      var py = Math.max(-8, -over * 0.035);
      var cy = Math.max(-8, -over * 0.012);
      dial.style.setProperty("--py", py.toFixed(1) + "px");
      dial.style.setProperty("--cy", cy.toFixed(1) + "px");
      disc.style.setProperty("--cy", cy.toFixed(1) + "px");
    }

    var nearest = clamp(Math.round(p), 0, lastPlate);
    if (nearest !== activePlate) updatePlateState(nearest);
    if (inst) {
      inst.classList.toggle("moved", p > .04);
      inst.classList.toggle("light", paper > 0.45);
    }
  }

  function showSess(n) {
    if (!sessEls.length) return;
    var next = ((n % sessEls.length) + sessEls.length) % sessEls.length;
    sessI = next;
    sessEls.forEach(function (el, j) {
      el.classList.toggle("on", j === sessI);
    });
    /* the disc already names the day. lighting the ring pulls the eye to TUE. */
  }

  function armSess() {
    window.clearTimeout(sessTimer);
    if (reduced || !sessEls.length) return;
    if (activePlate !== 2) return;
    if (document.body.classList.contains("asking") || document.body.classList.contains("reading")) return;
    sessTimer = window.setTimeout(function () {
      if (activePlate !== 2) return;
      showSess(sessI + 1);
      armSess();
    }, SESS_MS);
  }

  function wireInstrument() {
    var dial = $("#dial");
    if (dial && !dial.querySelector(".day")) {
      /* [abbr, word, mark] — the mark is the session's character,
         same vocabulary the app uses on the dial teeth. */
      var days = [
        ["MON", "Easy", "dot"], ["TUE", "Intervals", "reps"], ["WED", "Easy", "dot"],
        ["THU", "Speed", "speed"], ["FRI", "Easy", "dot"], ["SAT", "Long run", "arc"],
        ["SUN", "Rest", "rest"]
      ];
      var MARK = {
        dot:   '<svg width="14" height="8" viewBox="0 0 14 8" fill="currentColor" aria-hidden="true"><circle cx="7" cy="4" r="2"/></svg>',
        reps:  '<svg width="22" height="8" viewBox="0 0 22 8" fill="currentColor" aria-hidden="true"><circle cx="6" cy="4" r="1.7"/><circle cx="11" cy="4" r="1.7"/><circle cx="16" cy="4" r="1.7"/></svg>',
        speed: '<svg width="28" height="8" viewBox="0 0 28 8" fill="currentColor" aria-hidden="true"><circle cx="6" cy="4" r="1.85"/><circle cx="14" cy="4" r="1.85"/><circle cx="22" cy="4" r="1.85"/></svg>',
        arc:   '<svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 9 A9 9 0 0 1 20 9"/></svg>',
        rest:  '<svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 4 H14"/></svg>'
      };
      /* the week stays at rest. the disc names the day. */
      var frag = "";
      days.forEach(function (d, i) {
        var a = (180 + i * 30) * Math.PI / 180, r = 46; /* outside the disc, inside the mask fade */
        var x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a);
        var sc = (1 - Math.abs(i - 3) * 0.04).toFixed(2); /* gentler falloff — the set should read as one */
        var dl = (Math.abs(i - 3) * 0.055).toFixed(3); /* and it arrives in that order, top of the arc first */
        var ring = (i === 0 || i === 6) ? " edge" : (i === 1 || i === 5) ? " shoulder" : "";
        frag += '<div class="day' + ring + '" style="left:' + x + "%;top:" + y + "%;--s:" + sc + ";--d:" + dl + '">'
              + '<i class="mk">' + (MARK[d[2]] || MARK.dot) + "</i><b>" + d[0] + "</b><span>" + d[1] + "</span></div>";
      });
      dial.insertAdjacentHTML("beforeend", frag);
    }
    showSess(0);
  }

  function paintTicks() {
    var box = $("#ticks");
    if (!box) return;
    if (!box.children.length) {
      box.innerHTML = Array.from({ length: QN }, function (_, j) {
        return '<span class="tick">' + String(j + 1).padStart(2, "0") + "</span>";
      }).join("");
    }
    [].slice.call(box.children).forEach(function (el, j) {
      el.classList.toggle("done", j < qi);
      el.classList.toggle("now", j === qi);
    });
  }

  function showQ(i, immediate) {
    var next = Math.max(0, Math.min(QN - 1, i));
    var qs = $$(".q");
    var from = qs[qi];
    window.clearTimeout(qTimer);
    qs.forEach(function (q) { q.classList.remove("leaving"); });

    if (immediate || next === qi || !from) {
      qi = next;
      qs.forEach(function (q, j) { q.classList.toggle("on", j === qi); });
      paintTicks();
      return;
    }

    from.classList.remove("on");
    from.classList.add("leaving");
    qi = next;
    paintTicks();
    qTimer = window.setTimeout(function () {
      from.classList.remove("leaving");
      qs.forEach(function (q, j) { q.classList.toggle("on", j === qi); });
    }, 140);
  }

  function start() {
    returnPlate = clamp(Math.round(plates.scrollTop / plateHeight()), 0, lastPlate);
    mode("asking");
    pane("p-ask");
    showQ(0, true);
  }

  $("#begin").addEventListener("click", start);
  $("#back").addEventListener("click", function () {
    if (qi === 0) {
      pane(null);
      mode(null);
      snapToPlate(returnPlate, "auto");
    } else showQ(qi - 1);
  });
  $("#editBtn").addEventListener("click", function () { mode("asking"); pane("p-ask"); showQ(0, true); });
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
      $$('[data-key="' + key + '"] .opt').forEach(function (x) {
        x.setAttribute("aria-pressed", x.textContent === b.textContent ? "true" : "false");
      });
      A[key] = b.textContent;
      if (key === "goal") {
        var already = document.body.classList.contains("asking");
        if (!already) {
          returnPlate = clamp(Math.round(plates.scrollTop / plateHeight()), 0, lastPlate);
          window.setTimeout(function () {
            mode("asking");
            pane("p-ask");
            showQ(1, true);
          }, 180);
        } else {
          window.setTimeout(function () { showQ(1); }, 300);
        }
      }
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
    $("#rHead").textContent = "Here is what you told me.";
    var now = [];
    if (A.days) now.push(A.days + " days running");
    if (A.vol) now.push(/week/.test(A.vol) ? A.vol : A.vol + " a week");
    if (A.long) now.push("longest " + A.long.replace(" mi", "") + " mi");
    var other = A.other.filter(function (x) { return x !== "Nothing regularly"; });
    var rows = [];
    if (A.goal) rows.push(["You want to", A.goal.toLowerCase() + ".", ""]);
    if (now.length) rows.push(["Right now", now.join(" · "), other.length ? ("Also training: " + other.join(", ").toLowerCase()) : ""]);
    if (A.issue) rows.push(["The issue", '"' + A.issue + '"', "", true]);
    if (A.vid) rows.push(["Attached", A.vid, ""]);
    if (A.city) rows.push(["Where you train", A.city, ""]);
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
    Object.keys(data).forEach(function (k) { mail.append(k, data[k]); });
    var netlify = new FormData(); netlify.append("form-name", "run-development"); Object.keys(data).forEach(function (k) { netlify.append(k, data[k]); }); if (A.file) netlify.append("video", A.file);
    var emailed = fetch("https://formsubmit.co/ajax/" + encodeURIComponent(dest), { method:"POST", body:mail, headers:{Accept:"application/json"} }).then(function (r) { return r.json().then(function (j) { return { ok:r.ok, j:j }; }); });
    var stored = fetch("/", { method:"POST", body:netlify }).catch(function () { return null; });
    Promise.all([emailed, stored]).then(function (res) {
      var j = res[0] && res[0].j, sent = res[0] && res[0].ok && String(j && j.success) === "true";
      if (sent) { pane("p-done"); return; }
      fail(err, btn, data);
    }).catch(function () { fail(err, btn, data); });
  }

  /* A 200 from the mail relay is not proof of delivery — the relay answers 200
     while it waits for a one-time address confirmation. Gate on success, and
     never dead-end: hand back a prefilled email so the answers survive. */
  function fail(err, btn, data) {
    var lines = Object.keys(data).filter(function (k) { return data[k]; })
      .map(function (k) { return k + ": " + data[k]; }).join("\n");
    var href = "mailto:" + BRICE
      + "?subject=" + encodeURIComponent(data.offer + " — " + (data.name || "new start"))
      + "&body=" + encodeURIComponent(lines);
    err.hidden = false;
    err.innerHTML = 'It did not send. <a href="' + href + '">Send it as an email instead</a> — your answers are already in it.';
    btn.disabled = false; sending = false;
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

  showQ(0, true);
  pane(null);
  measure();
  wireThesis();
  wireInstrument();
  paintScroll();
  updatePlateState(0);
  keepFilm(filmA);
})();
