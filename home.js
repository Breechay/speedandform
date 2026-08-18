(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  var A = { other: [] };
  var qi = 0;
  var QN = 5;
  // Send to Brice always posts to this Gmail. Do not change without Brice.
  var BRICE = "briceikouebe@gmail.com";
  var sending = false;

  function pane(id) {
    $$(".pane").forEach(function (p) { p.classList.toggle("on", p.id === id); });
    window.scrollTo(0, 0);
  }
  function mode(m) {
    document.body.classList.remove("asking", "reading");
    if (m) document.body.classList.add(m);
  }
  function showQ(i) {
    qi = Math.max(0, Math.min(QN - 1, i));
    $$(".q").forEach(function (q, j) { q.classList.toggle("on", j === qi); });
    $("#ticks").innerHTML = Array.from({ length: QN }, function (_, j) {
      return '<span class="tick ' + (j < qi ? "done" : j === qi ? "now" : "") + '">' +
        String(j + 1).padStart(2, "0") + "</span>";
    }).join("");
  }
  function start() {
    mode("asking");
    pane("p-ask");
    showQ(0);
  }

  $("#begin").addEventListener("click", start);
  $("#back").addEventListener("click", function () {
    if (qi === 0) { mode(null); pane("p-hero"); }
    else showQ(qi - 1);
  });
  $("#editBtn").addEventListener("click", function () {
    mode("asking");
    pane("p-ask");
    showQ(0);
  });
  $("#restart").addEventListener("click", function () {
    mode(null);
    pane("p-hero");
  });

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
          $$('[data-key="other"] .opt').forEach(function (x) {
            x.setAttribute("aria-pressed", "false");
          });
          if (turningOn) b.setAttribute("aria-pressed", "true");
        } else {
          $$('[data-key="other"] .opt').forEach(function (x) {
            if (x.textContent === "Nothing regularly") x.setAttribute("aria-pressed", "false");
          });
          b.setAttribute("aria-pressed", turningOn ? "true" : "false");
        }
        A.other = $$('[data-key="other"] .opt[aria-pressed="true"]').map(function (x) {
          return x.textContent;
        });
        return;
      }
      $$('[data-key="' + key + '"] .opt').forEach(function (x) {
        x.setAttribute("aria-pressed", "false");
      });
      b.setAttribute("aria-pressed", "true");
      A[key] = b.textContent;
      if (key === "goal") setTimeout(function () { showQ(1); }, 280);
    });
  });

  $$("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (qi === 3) A.issue = $("#issue").value.trim();
      if (qi === 4) {
        A.name = $("#nm").value.trim();
        A.mail = $("#em").value.trim();
        var need = $("#needMail");
        if (!/.+@.+\..+/.test(A.mail)) {
          need.hidden = false;
          $("#em").focus();
          return;
        }
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
    A.vid = f.name;
    A.file = f;
    $("#dropT").textContent = f.name;
    $("#drop").classList.add("has");
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
    $("#rHead").textContent = A.name
      ? (A.name.split(" ")[0] + ", here is where you are.")
      : "Here is where you are.";

    var now = [];
    if (A.days) now.push(A.days + " days running");
    if (A.vol) now.push(/week/.test(A.vol) ? A.vol : A.vol + " a week");
    if (A.long) now.push("longest " + A.long.replace(" mi", "") + " mi");
    var other = A.other.filter(function (x) { return x !== "Nothing regularly"; });

    var rows = [];
    if (A.goal) rows.push(["You want to", A.goal.toLowerCase() + ".", ""]);
    if (now.length) {
      rows.push(["Right now", now.join(" · "), other.length ? ("Also training: " + other.join(", ").toLowerCase()) : ""]);
    }
    if (A.issue) rows.push(["The issue", '"' + A.issue + '"', "", true]);
    if (A.vid) rows.push(["Attached", A.vid, "Brice will watch it before he replies."]);
    if (both) {
      rows.push(["Why both", "Running and lifting are already in the same week.",
        "One person writing both is the only way they stop taking from each other."]);
    }
    if (A.city === "Miami") {
      rows.push(["Miami", "Some key sessions can happen together.",
        "When seeing the work in person is worth more than reading about it."]);
    }

    $("#rRows").innerHTML = rows.map(function (r, i) {
      return '<div class="row" style="animation-delay:' + (0.12 + i * 0.09) + 's"><label>' + r[0] + "</label>" +
        "<p" + (r[3] ? ' class="quote"' : "") + ">" + r[1] + "</p>" +
        (r[2] ? "<small>" + r[2] + "</small>" : "") + "</div>";
    }).join("");
  }

  function payload() {
    var both = offer();
    return {
      offer: both ? "Run + Strength" : "Run Development",
      price: both ? "8 weeks · $1,800" : "8 weeks · $1,200",
      goal: A.goal || "",
      days: A.days || "",
      volume: A.vol || "",
      longest: A.long || "",
      other: (A.other || []).join(", "),
      issue: A.issue || "",
      city: A.city || "",
      name: A.name || "",
      email: A.mail || "",
      "video-name": A.vid || ""
    };
  }

  function sendToBrice() {
    if (sending) return;
    sending = true;
    var btn = $("#sendBtn");
    var err = $("#sendErr");
    btn.disabled = true;
    err.hidden = true;

    var data = payload();
    var dest = ($("#sendBtn").getAttribute("data-send-to") || BRICE).trim() || BRICE;
    var mail = new FormData();
    mail.append("_subject", data.offer + " — " + (data.name || "new start"));
    mail.append("_template", "table");
    mail.append("_captcha", "false");
    if (data.email) mail.append("_replyto", data.email);
    Object.keys(data).forEach(function (k) { mail.append(k, data[k]); });
    if (A.file) mail.append("video", A.file);

    var netlify = new FormData();
    netlify.append("form-name", "run-development");
    Object.keys(data).forEach(function (k) { netlify.append(k, data[k]); });
    if (A.file) netlify.append("video", A.file);

    var emailed = fetch("https://formsubmit.co/ajax/" + encodeURIComponent(dest), {
      method: "POST",
      body: mail,
      headers: { Accept: "application/json" }
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });

    var stored = fetch("/", { method: "POST", body: netlify }).catch(function () { return null; });

    Promise.all([emailed, stored]).then(function (res) {
      var mailRes = res[0];
      if (mailRes && mailRes.ok) {
        pane("p-done");
        return;
      }
      err.hidden = false;
      err.textContent = "It did not send. Check the address and try again.";
      btn.disabled = false;
      sending = false;
    }).catch(function () {
      err.hidden = false;
      err.textContent = "It did not send. Try again.";
      btn.disabled = false;
      sending = false;
    });
  }

  $("#sendBtn").addEventListener("click", sendToBrice);
  showQ(0);
})();
