/* Arrival and scroll settle for the current homepage. Content is never gated. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("sf-motion")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.remove("sf-motion");
    return;
  }

  var h1 = document.querySelector(".sf-home-hero-immersive h1");
  if (h1 && !h1.querySelector(".sf-line")) {
    var parts = h1.innerHTML.split(/<br\s*\/?>/i);
    if (parts.length > 1) {
      h1.innerHTML = parts.map(function (part) {
        return '<span class="sf-line"><i>' + part.trim() + "</i></span>";
      }).join("");
    }
  }

  function arrive() {
    root.classList.add("sf-arrived");
  }
  if (document.readyState === "complete") arrive();
  else window.addEventListener("load", arrive, { once: true });
  window.setTimeout(arrive, 1200);

  var sections = document.querySelectorAll(".home-entry, .home-evidence, .home-also, .intake");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("sf-in");
        var hold = entry.target.querySelector(".home-evidence-result dt");
        if (hold) countMiles(hold);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.16 });
    sections.forEach(function (section) { io.observe(section); });
  } else {
    sections.forEach(function (section) { section.classList.add("sf-in"); });
  }

  function countMiles(dt) {
    if (dt.dataset.counted) return;
    var match = dt.textContent.match(/^(\d+)\b/);
    if (!match) return;
    dt.dataset.counted = "1";
    var target = Number(match[1]);
    var rest = dt.textContent.slice(match[1].length);
    var num = document.createElement("span");
    num.className = "sf-count";
    num.textContent = "0";
    dt.textContent = "";
    dt.appendChild(num);
    dt.appendChild(document.createTextNode(rest));
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / 900);
      var eased = 1 - Math.pow(1 - t, 3);
      num.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}());
