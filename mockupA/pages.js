(function () {
  function bindShot(inputId, hostId) {
    const input = document.getElementById(inputId);
    const host = document.getElementById(hostId);
    if (!input || !host) return;
    input.addEventListener("change", function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const img = document.createElement("img");
      img.alt = "";
      img.src = URL.createObjectURL(file);
      host.replaceChildren(img);
    });
  }

  bindShot("formShotInput", "formShot");
  bindShot("breechayShotInput", "breechayShot");

  const rowsEl = document.getElementById("sentRows");
  const lead = document.getElementById("sentLead");
  if (rowsEl) {
    try {
      const data = JSON.parse(sessionStorage.getItem("mockupA-receipt") || "null");
      if (data) {
        if (lead && data.offer) {
          lead.textContent = data.offer + " · " + data.meta + ". He reads every submission.";
        }
        (data.rows || []).forEach(function (row) {
          const div = document.createElement("div");
          div.className = "rrow";
          const span = document.createElement("span");
          span.textContent = row[0];
          const b = document.createElement("b");
          b.textContent = row[1];
          div.appendChild(span);
          div.appendChild(b);
          rowsEl.appendChild(div);
        });
      }
    } catch (e) { /* ignore */ }
  }
})();
