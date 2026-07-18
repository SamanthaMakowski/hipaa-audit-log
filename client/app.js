cat > client/app.js << 'EOF'
const actorSelect = document.getElementById("actor-select");
const patientSelect = document.getElementById("patient-select");
const viewBtn = document.getElementById("view-btn");
const accessResult = document.getElementById("access-result");
const verifyBtn = document.getElementById("verify-btn");
const verifyResult = document.getElementById("verify-result");
const rows = document.getElementById("audit-rows");

const filters = {
  actor: document.getElementById("filter-actor"),
  action: document.getElementById("filter-action"),
  outcome: document.getElementById("filter-outcome"),
  target: document.getElementById("filter-target")
};

let entries = [];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function visible() {
  const who = filters.actor.value.trim().toLowerCase();
  const what = filters.action.value;
  const how = filters.outcome.value;
  const which = filters.target.value.trim().toLowerCase();

  return entries.filter(e => {
    if (who && !e.actor.toLowerCase().includes(who)) return false;
    if (what !== "all" && e.action !== what) return false;
    if (how !== "all" && e.outcome !== how) return false;
    if (which) {
      const target = (e.target + " " + (e.targetName || "")).toLowerCase();
      if (!target.includes(which)) return false;
    }
    return true;
  });
}

function render() {
  const list = visible();
  rows.innerHTML = "";

  if (list.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "empty";
    td.textContent = "No entries match these filters.";
    tr.appendChild(td);
    rows.appendChild(tr);
    return;
  }

  list.forEach(e => {
    const tr = document.createElement("tr");
    const label = e.targetName && e.targetName !== "unknown record" ? e.target + " " + e.targetName : e.target;

    [formatTime(e.timestamp), e.actor, e.action, label].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });

    const outcome = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = e.outcome === "denied" ? "chip denied" : "chip success";
    chip.textContent = e.outcome;
    outcome.appendChild(chip);
    tr.appendChild(outcome);

    rows.appendChild(tr);
  });
}

async function loadTrail() {
  const res = await fetch("/api/audit-log");
  entries = await res.json();
  render();
}

viewBtn.addEventListener("click", async () => {
  const actor = actorSelect.value;
  const id = patientSelect.value;
  const res = await fetch("/api/patients/" + id + "?actor=" + actor);
  const data = await res.json();

  if (res.ok) {
    accessResult.className = "result allowed";
    accessResult.textContent = "Opened " + data.name + " (" + data.mrn + ")";
  } else {
    accessResult.className = "result refused";
    accessResult.textContent = "Refused: " + data.error;
  }

  loadTrail();
});

verifyBtn.addEventListener("click", async () => {
  const res = await fetch("/api/audit-log/verify");
  const result = await res.json();

  if (result.valid) {
    verifyResult.className = "result intact";
    verifyResult.textContent = "Chain intact. " + result.checked + " entries verified.";
  } else {
    verifyResult.className = "result broken";
    verifyResult.textContent = "Tampering detected at entry " + result.brokenAt + ". " + result.reason + ".";
  }
});

Object.values(filters).forEach(f => f.addEventListener("input", render));

loadTrail();
EOF