(function () {
  const GOALS = [
    "Run faster",
    "Run longer",
    "Run more consistently",
    "Build durability",
    "Return to running",
    "Balance running + lifting",
    "Prepare for a race",
    "I’m not sure yet",
  ];

  const OTHER = [
    "Strength",
    "HYROX",
    "Cycling",
    "Swimming",
    "Sport",
    "Nothing regularly",
  ];

  const LOCS = ["Miami", "Elsewhere"];

  const STATES = ["hero", "q1", "q2", "q3", "q4", "q5", "pause", "receipt"];

  const answers = {
    goals: [],
    days: 0,
    miles: 0,
    longest: 0,
    weekNote: "",
    other: [],
    friction: "",
    videoName: "",
    videoUrl: "",
    name: "",
    email: "",
    location: "",
  };

  const video = document.getElementById("heroVideo");
  const still = document.getElementById("heroStill");
  const rail = document.getElementById("rail");
  const progress = document.getElementById("progress");
  const receiptRows = document.getElementById("receiptRows");
  const receiptOffer = document.getElementById("receiptOffer");
  const receiptMeta = document.getElementById("receiptMeta");
  const receiptMiami = document.getElementById("receiptMiami");
  const runPreview = document.getElementById("runPreview");
  const uploadZone = document.getElementById("uploadZone");
  const menuPanel = document.getElementById("menuPanel");
  const navToggle = document.getElementById("navToggle");
  const lab = document.getElementById("lab");
  const stateLab = document.getElementById("stateLab");

  let current = "hero";
  let pauseTimer = null;
  const defaultFilmSrc = (video && (video.getAttribute("src") || video.querySelector("source")?.getAttribute("src"))) || "jose-marky.mp4";

  function hashFor(state) {
    return "#" + state;
  }

  function modeFor(state) {
    if (state === "hero") return "hero";
    if (state === "receipt") return "receipt";
    return "ask";
  }

  function setState(state, { skipHash } = {}) {
    current = state;
    document.body.dataset.mode = modeFor(state);
    document.body.classList.remove("mode-ask", "mode-receipt", "mode-hero");
    document.body.classList.add("mode-" + modeFor(state));

    document.querySelectorAll(".q").forEach(function (q) {
      q.classList.toggle("is-on", state === "q" + q.dataset.q);
    });

    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }

    if (state === "pause") {
      document.querySelectorAll(".q").forEach(function (q) {
        q.classList.remove("is-on");
      });
      pauseTimer = setTimeout(function () {
        setState("receipt");
      }, 600);
    }

    if (state === "receipt") assembleReceipt();
    updateProgress();
    updateRail();
    markStateLab();

    if (!skipHash && state !== "pause" && location.hash !== hashFor(state)) {
      history.replaceState(null, "", hashFor(state));
    }
  }

  function updateProgress() {
    if (!progress) return;
    const n = { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5 }[current] || 0;
    progress.querySelectorAll("span").forEach(function (span) {
      const i = Number(span.dataset.n);
      span.classList.toggle("is-current", i === n);
      span.classList.toggle("is-done", n > 0 && i < n);
    });
  }

  function updateRail() {
    if (!rail) return;
    rail.innerHTML = "";
    function add(text) {
      if (!text) return;
      const span = document.createElement("span");
      span.className = "is-in";
      span.textContent = text;
      rail.appendChild(span);
    }
    answers.goals.forEach(add);
    const week = [];
    if (answers.days) week.push(answers.days + " d/wk");
    if (answers.miles) week.push("~" + answers.miles + " mi");
    if (answers.longest) week.push("long " + answers.longest + " mi");
    if (week.length) add(week.join(" · "));
    answers.other.forEach(function (o) {
      if (o !== "Nothing regularly") add(o);
    });
    if (answers.friction) add(answers.friction.slice(0, 40));
    if (answers.location) add(answers.location);
  }

  function renderOptions(el, items, key, multi) {
    if (!el) return;
    el.innerHTML = "";
    items.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.innerHTML = "<span></span><span class=\"dot\">●</span>";
      btn.querySelector("span").textContent = item;
      btn.addEventListener("click", function () {
        if (multi) {
          if (item === "Nothing regularly") {
            answers[key] = answers[key].indexOf(item) >= 0 ? [] : ["Nothing regularly"];
          } else {
            answers[key] = answers[key].filter(function (x) { return x !== "Nothing regularly"; });
            const i = answers[key].indexOf(item);
            if (i >= 0) answers[key].splice(i, 1);
            else answers[key].push(item);
          }
        } else {
          answers[key] = answers[key] === item ? "" : item;
        }
        Array.from(el.children).forEach(function (c) {
          const label = c.querySelector("span").textContent;
          const on = multi ? answers[key].indexOf(label) >= 0 : answers[key] === label;
          c.classList.toggle("on", on);
        });
        updateRail();
      });
      el.appendChild(btn);
    });
  }

  function paintCounters() {
    const daysOut = document.getElementById("daysOut");
    const milesOut = document.getElementById("milesOut");
    const longestOut = document.getElementById("longestOut");
    if (daysOut) daysOut.textContent = answers.days ? String(answers.days) : "—";
    if (milesOut) milesOut.textContent = answers.miles ? String(answers.miles) : "—";
    if (longestOut) longestOut.textContent = answers.longest ? answers.longest + " mi" : "—";
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function shouldOfferRunStrength() {
    const goals = answers.goals;
    const other = answers.other;
    if (goals.indexOf("Balance running + lifting") >= 0) return true;
    const lifts = other.indexOf("Strength") >= 0 || other.indexOf("HYROX") >= 0;
    const runningWeek = answers.days >= 2 || answers.miles > 0;
    return lifts && runningWeek && goals.indexOf("I’m not sure yet") < 0;
  }

  function readLateFields() {
    answers.weekNote = (document.getElementById("weekNote") || {}).value.trim() || "";
    answers.friction = (document.getElementById("friction") || {}).value.trim() || "";
    answers.name = (document.getElementById("name") || {}).value.trim() || "";
    answers.email = (document.getElementById("email") || {}).value.trim() || "";
  }

  function assembleReceipt() {
    readLateFields();
    const runStrength = shouldOfferRunStrength();
    receiptOffer.textContent = runStrength ? "Run + Strength" : "Run Development";
    receiptMeta.textContent = runStrength ? "8 weeks · $1,800" : "8 weeks · $1,200";

    const rows = [];
    if (answers.goals.length) rows.push(["Improve", answers.goals.join(", ")]);
    const week = [];
    if (answers.days) week.push(answers.days + " days / week");
    if (answers.miles) week.push("~" + answers.miles + " miles");
    if (answers.longest) week.push("longest " + answers.longest + " mi");
    if (week.length) rows.push(["Running now", week.join(" · ")]);
    if (answers.weekNote) rows.push(["Note", answers.weekNote]);
    const other = answers.other.filter(function (x) { return x !== "Nothing regularly"; });
    if (other.length) rows.push(["Also training", other.join(", ")]);
    else if (answers.other.indexOf("Nothing regularly") >= 0) rows.push(["Also training", "Nothing regularly"]);
    if (answers.friction) rows.push(["Not going the way you want", answers.friction]);
    if (answers.videoName) rows.push(["Video", answers.videoName]);
    if (answers.name) rows.push(["Name", answers.name]);
    if (answers.email) rows.push(["Email", answers.email]);
    if (answers.location) rows.push(["Where", answers.location]);

    receiptRows.innerHTML = "";
    rows.forEach(function (row) {
      const div = document.createElement("div");
      div.className = "rrow";
      const span = document.createElement("span");
      span.textContent = row[0];
      const b = document.createElement("b");
      if (row[0] === "Not going the way you want") b.className = "quote";
      b.textContent = row[1];
      div.appendChild(span);
      div.appendChild(b);
      receiptRows.appendChild(div);
    });

    receiptMiami.classList.toggle("is-on", answers.location === "Miami");

    try {
      sessionStorage.setItem("mockupA-receipt", JSON.stringify({
        offer: receiptOffer.textContent,
        meta: receiptMeta.textContent,
        rows: rows,
        miami: answers.location === "Miami",
      }));
    } catch (e) { /* ignore */ }
  }

  function goNext() {
    readLateFields();
    if (current === "hero") setState("q1");
    else if (current === "q1") setState("q2");
    else if (current === "q2") setState("q3");
    else if (current === "q3") setState("q4");
    else if (current === "q4") setState("q5");
    else if (current === "q5") setState("pause");
  }

  function goBack() {
    if (current === "q1") setState("hero");
    else if (current === "q2") setState("q1");
    else if (current === "q3") setState("q2");
    else if (current === "q4") setState("q3");
    else if (current === "q5") setState("q4");
    else if (current === "receipt") setState("q5");
  }

  renderOptions(document.getElementById("q1Options"), GOALS, "goals", true);
  renderOptions(document.getElementById("q3Options"), OTHER, "other", true);
  renderOptions(document.getElementById("locOptions"), LOCS, "location", false);

  document.getElementById("btnBegin").addEventListener("click", function () { setState("q1"); });
  document.getElementById("headerBegin").addEventListener("click", function () { setState("q1"); });
  document.getElementById("btnNext").addEventListener("click", goNext);
  document.getElementById("btnBack").addEventListener("click", goBack);

  document.querySelectorAll("[data-bump]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const parts = btn.dataset.bump.split(":");
      const key = parts[0];
      const delta = Number(parts[1]);
      const max = key === "days" ? 7 : key === "miles" ? 120 : 30;
      const min = 0;
      answers[key] = clamp((answers[key] || 0) + delta, min, max);
      paintCounters();
      updateRail();
    });
  });

  document.getElementById("runVideo").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (answers.videoUrl) URL.revokeObjectURL(answers.videoUrl);
    answers.videoName = file.name;
    answers.videoUrl = URL.createObjectURL(file);
    runPreview.src = answers.videoUrl;
    runPreview.play().catch(function () {});
    uploadZone.classList.add("has-file");
    updateRail();
  });

  document.getElementById("editToggle").addEventListener("click", function () {
    const on = document.body.classList.toggle("is-editing");
    this.classList.toggle("is-on", on);
    this.lastChild.textContent = on ? "Done" : "Edit text";
    document.querySelectorAll("[data-edit]").forEach(function (el) {
      el.contentEditable = on ? "true" : "false";
    });
  });

  function openLab(open) {
    lab.classList.toggle("open", open);
    document.getElementById("labToggle").classList.toggle("is-on", open);
  }
  document.getElementById("labToggle").addEventListener("click", function () {
    openLab(!lab.classList.contains("open"));
  });
  document.getElementById("labClose").addEventListener("click", function () { openLab(false); });

  document.getElementById("labY").addEventListener("input", function () {
    document.documentElement.style.setProperty("--heroY", this.value + "%");
    document.getElementById("labYVal").textContent = this.value;
  });
  document.getElementById("labScrim").addEventListener("input", function () {
    document.documentElement.style.setProperty("--scrimA", String(Number(this.value) / 100));
    document.getElementById("labScrimVal").textContent = this.value;
  });

  document.getElementById("labFilm").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !video) return;
    const url = URL.createObjectURL(file);
    still.classList.remove("is-on");
    video.style.opacity = "";
    video.src = url;
    video.play().catch(function () {});
  });

  document.getElementById("labStill").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    still.src = URL.createObjectURL(file);
    still.classList.add("is-on");
  });

  document.getElementById("labReset").addEventListener("click", function () {
    still.classList.remove("is-on");
    still.removeAttribute("src");
    if (!video) return;
    video.style.opacity = "";
    video.src = defaultFilmSrc;
    video.play().catch(function () {});
  });

  navToggle.addEventListener("click", function () {
    const isOpen = menuPanel.classList.contains("is-open");
    if (isOpen) {
      menuPanel.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      menuPanel.setAttribute("hidden", "");
    } else {
      menuPanel.removeAttribute("hidden");
      requestAnimationFrame(function () { menuPanel.classList.add("is-open"); });
      navToggle.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
    }
  });

  STATES.forEach(function (s, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.state = s;
    b.textContent = String(i).padStart(2, "0");
    b.addEventListener("click", function () { setState(s); });
    stateLab.appendChild(b);
  });

  function markStateLab() {
    stateLab.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.state === current);
    });
  }

  function fromHash() {
    const h = (location.hash || "#hero").replace("#", "");
    if (STATES.indexOf(h) >= 0 && h !== "pause") {
      setState(h, { skipHash: true });
      return;
    }
    setState("hero", { skipHash: true });
  }

  window.addEventListener("hashchange", fromHash);
  paintCounters();
  fromHash();
  if (video) video.play().catch(function () {});
})();
