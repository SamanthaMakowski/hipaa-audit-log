const { getEntries, hashEntry, GENESIS_HASH } = require("./log");

function verifyChain() {
  const entries = getEntries();

  if (entries.length === 0) {
    return { valid: true, checked: 0, brokenAt: null, reason: null };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : entries[i - 1].hash;

    if (entry.prevHash !== expectedPrev) {
      return {
        valid: false,
        checked: i,
        brokenAt: entry.id,
        reason: "chain link does not match the previous entry"
      };
    }

    const fields = [entry.id, entry.timestamp, entry.actor, entry.action, entry.target, entry.outcome, entry.prevHash];

    if (hashEntry(fields) !== entry.hash) {
      return {
        valid: false,
        checked: i,
        brokenAt: entry.id,
        reason: "entry contents do not match its hash"
      };
    }
  }

  return { valid: true, checked: entries.length, brokenAt: null, reason: null };
}

module.exports = { verifyChain };