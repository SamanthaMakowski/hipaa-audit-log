const fs = require("fs");
const { appendEntry, GENESIS_HASH, LOG_PATH } = require("./log");
const { verifyChain } = require("./verify");
const backup = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "";
let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log("PASS  " + label);
  } else {
    failed++;
    console.log("FAIL  " + label);
  }
}
function reset() {
  fs.writeFileSync(LOG_PATH, "");
}
function restore() {
  fs.writeFileSync(LOG_PATH, backup);
}
function readRaw() {
  return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
}
reset();
check("empty log verifies as valid", verifyChain().valid === true);
check("empty log reports zero entries checked", verifyChain().checked === 0);
const first = appendEntry({ actor: "dr.reyes", action: "viewed", target: "P001", outcome: "success" });
check("first entry starts at id 1", first.id === 1);
check("first entry chains from the genesis hash", first.prevHash === GENESIS_HASH);
check("entry records actor action target and outcome", first.actor === "dr.reyes" && first.action === "viewed" && first.target === "P001" && first.outcome === "success");
const second = appendEntry({ actor: "frontdesk.lee", action: "viewed", target: "P001", outcome: "denied" });
check("ids increment", second.id === 2);
check("each entry chains to the hash before it", second.prevHash === first.hash);
check("denied attempts are recorded not just blocked", second.outcome === "denied");
check("a clean chain verifies", verifyChain().valid === true);
check("verification counts every entry", verifyChain().checked === 2);
const edited = readRaw();
edited[1].outcome = "success";
fs.writeFileSync(LOG_PATH, JSON.stringify(edited, null, 2));
const afterEdit = verifyChain();
check("editing an entry is detected", afterEdit.valid === false);
check("detection names the altered entry", afterEdit.brokenAt === 2);
reset();
appendEntry({ actor: "nurse.patel", action: "viewed", target: "P001", outcome: "success" });
appendEntry({ actor: "nurse.patel", action: "viewed", target: "P002", outcome: "success" });
appendEntry({ actor: "nurse.patel", action: "viewed", target: "P003", outcome: "success" });
const trimmed = readRaw().filter(e => e.id !== 2);
fs.writeFileSync(LOG_PATH, JSON.stringify(trimmed, null, 2));
const afterDelete = verifyChain();
check("removing an entry is detected", afterDelete.valid === false);
check("removal breaks the link at the following entry", afterDelete.brokenAt === 3);
restore();
check("the real log is intact after the tests run", verifyChain().valid === true);
console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) {
  process.exit(1);
}
