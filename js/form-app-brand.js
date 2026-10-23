/* The page is an illustration, not a sign-in or workout editor.
   The controls only select an appearance for all three sample screens. */
(function () {
  "use strict";
  const board = document.getElementById("fa-preview");
  const caption = document.getElementById("fa-selected-caption");
  const options = Array.from(document.querySelectorAll("[data-choose-theme]"));
  if (!board || !caption || options.length !== 3) return;

  const captions = {
    quiet: "Bone / Quiet Clay. A lifted chalk card marks the current week.",
    signature: "Clay / Stronger Signature. The current week and primary action fill with clay.",
    dark: "Charcoal / After Dark. Sunset details sit on raised charcoal; the primary action turns chalk."
  };
  function selectTheme(theme) {
    if (!Object.prototype.hasOwnProperty.call(captions, theme)) return;
    board.dataset.theme = theme;
    options.forEach(function (option) {
      option.setAttribute("aria-pressed", String(option.dataset.chooseTheme === theme));
    });
    caption.textContent = captions[theme];
  }
  options.forEach(function (option) {
    option.addEventListener("click", function () { selectTheme(option.dataset.chooseTheme); });
  });
})();
