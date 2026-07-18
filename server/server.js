const express = require("express");
const path = require("path");
const patients = require("./data/patients.json");
const { appendEntry, getEntries } = require("./audit/log");
const { verifyChain } = require("./audit/verify");

const app = express();
const PORT = process.env.PORT || 3000;

const ACTORS = {
  "dr.reyes": { role: "physician", panel: ["P001", "P002", "P003"] },
  "nurse.patel": { role: "nurse", panel: ["P001", "P002", "P003", "P004"] },
  "frontdesk.lee": { role: "front desk", panel: [] },
  "admin.brooks": { role: "admin", panel: ["P001", "P002", "P003", "P004", "P005", "P006"] }
};

app.use(express.static(path.join(__dirname, "..", "client")));

function patientName(id) {
  const match = patients.find(p => p.id === id);
  return match ? match.name : "unknown record";
}

app.get("/api/patients", (req, res) => {
  const actor = req.query.actor;
  if (!ACTORS[actor]) {
    return res.status(400).json({ error: "unknown actor" });
  }
  appendEntry({ actor, action: "searched", target: "patient list", outcome: "success" });
  res.json(patients.map(p => ({ id: p.id, name: p.name, mrn: p.mrn })));
});

app.get("/api/patients/:id", (req, res) => {
  const actor = req.query.actor;
  const id = req.params.id;

  if (!ACTORS[actor]) {
    return res.status(400).json({ error: "unknown actor" });
  }

  const record = patients.find(p => p.id === id);
  if (!record) {
    appendEntry({ actor, action: "viewed", target: id, outcome: "denied" });
    return res.status(404).json({ error: "record not found" });
  }

  if (!ACTORS[actor].panel.includes(id)) {
    appendEntry({ actor, action: "viewed", target: id, outcome: "denied" });
    return res.status(403).json({ error: "no treatment relationship with this patient" });
  }

  appendEntry({ actor, action: "viewed", target: id, outcome: "success" });
  res.json(record);
});

app.get("/api/audit-log", (req, res) => {
  const entries = getEntries().map(e => ({ ...e, targetName: patientName(e.target) }));
  res.json(entries.slice().reverse());
});

app.get("/api/audit-log/verify", (req, res) => {
  res.json(verifyChain());
});

app.listen(PORT, () => {
  console.log(`audit log running on http://localhost:${PORT}`);
});
