const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LOG_PATH = path.join(__dirname, "..", "data", "audit-log.json");
const GENESIS_HASH = "0".repeat(64);

function hashEntry(fields) {
  return crypto.createHash("sha256").update(JSON.stringify(fields)).digest("hex");
}

function getEntries() {
  if (!fs.existsSync(LOG_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(LOG_PATH, "utf8");
  if (raw.trim() === "") {
    return [];
  }
  return JSON.parse(raw);
}

function appendEntry(input) {
  const entries = getEntries();
  const previous = entries[entries.length - 1];
  const prevHash = previous ? previous.hash : GENESIS_HASH;
  const id = previous ? previous.id + 1 : 1;
  const timestamp = new Date().toISOString();

  const fields = [id, timestamp, input.actor, input.action, input.target, input.outcome, prevHash];
  const hash = hashEntry(fields);

  const entry = {
    id,
    timestamp,
    actor: input.actor,
    action: input.action,
    target: input.target,
    outcome: input.outcome,
    prevHash,
    hash
  };

  entries.push(entry);
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2));
  return entry;
}

module.exports = { appendEntry, getEntries, hashEntry, GENESIS_HASH, LOG_PATH };