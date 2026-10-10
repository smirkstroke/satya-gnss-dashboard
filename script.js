// Satya-GNSS dashboard prototype
// All values below are synthetic examples for a local demo.
// They are not live receiver measurements or validated attack detection.

const WEIGHTS = [0.35, 0.20, 0.20, 0.25];

const pillarInfo = [
  { title: "Fixed location", description: "Compare reported position with surveyed site coordinates." },
  { title: "Dual-band L1 / L5", description: "Check whether the two frequency-band solutions agree." },
  { title: "GPS / NavIC clash", description: "Compare independently computed constellation solutions." },
  { title: "1-PPS timing", description: "Compare receiver pulse timing with the local hardware timer." }
];

const scenarios = {
  normal: {
    label: "Normal reception", pillars: [1, 1, 1, 1], satellites: 18, hdop: 0.9,
    flag: "NONE", classification: "No attack signature", locationFailed: false,
    notes: ["Within expected range (simulated)", "Bands agree (simulated)", "Solutions agree (simulated)", "Timing consistent (simulated)"]
  },
  weak: {
    label: "Weak signal", pillars: [1, 0.5, 1, 1], satellites: 7, hdop: 3.0,
    flag: "NONE", classification: "Weak-signal condition", locationFailed: false,
    notes: ["Within expected range (simulated)", "L5 unavailable / partial (simulated)", "Solutions agree (simulated)", "Timing consistent (simulated)"]
  },
  spoofing: {
    label: "Spoofing-like", pillars: [0, 0.2, 0.5, 0.3], satellites: 18, hdop: 1.1,
    flag: "SPOOFING-LIKE", classification: "Synthetic position / timing mismatch", locationFailed: true,
    notes: ["Position differs from site (simulated)", "Band disagreement (simulated)", "Partial constellation mismatch (simulated)", "Timing mismatch (simulated)"]
  },
  jamming: {
    label: "Jamming-like", pillars: [0.5, 0.5, 0.5, 0.5], satellites: 3, hdop: 6.5,
    flag: "JAMMING-LIKE", classification: "Synthetic fix-loss / low-signal pattern", locationFailed: false,
    notes: ["Unavailable: fix lost (simulated)", "Unavailable: band data (simulated)", "Unavailable: constellation data (simulated)", "Unavailable: timing comparison (simulated)"]
  },
  missing: {
    label: "Missing data", pillars: [null, null, null, null], satellites: 0, hdop: 99,
    flag: "UNKNOWN", classification: "Data gap — attack not determined", locationFailed: false,
    notes: ["No valid input", "No valid input", "No valid input", "No valid input"]
  }
};

let eventLog = [];
let history = [];
let activeScenario = "normal";
let sequence = 0;
let currentResult = null;

const $ = (id) => document.getElementById(id);

function getConfidence(satellites, hdop) {
  const qSat = Math.min(1, satellites / 12);
  let qDop;
  if (hdop <= 2) qDop = 1.0;
  else if (hdop <= 5) qDop = 0.7;
  else qDop = 0.4;
  return { qSat, qDop, confidence: 0.5 + 0.5 * qSat * qDop };
}

function calculateTrust(data) {
  // The dossier says an unavailable pillar must be 0.5, never 1.
  const scores = data.pillars.map(value => value === null ? 0.5 : value);
  const weightedSum = scores.reduce((sum, value, index) => sum + value * WEIGHTS[index], 0);
  const { qSat, qDop, confidence } = getConfidence(data.satellites, data.hdop);
  let score = Math.round(100 * weightedSum * confidence);

  // V4 draft rule: sustained fixed-location failure caps the score at 59.
  if (data.locationFailed) score = Math.min(score, 59);

  let status;
  if (score >= 80) status = "TRUSTED";
  else if (score >= 60) status = "WATCH";
  else if (score >= 40) status = "SUSPICIOUS";
  else status = "CRITICAL";

  return { score, status, weightedSum, qSat, qDop, confidence };
}

function statusClass(status) {
  return status.toLowerCase();
}

function pillarState(value) {
  if (value === null) return { label: "NO DATA", className: "unknown" };
  if (value >= 0.8) return { label: "PASS", className: "good" };
  if (value >= 0.5) return { label: "WATCH", className: "warn" };
  return { label: "FAIL", className: "bad" };
}

function colorForStatus(status) {
  if (status === "TRUSTED") return "#44d6a1";
  if (status === "WATCH") return "#f4bd62";
  if (status === "SUSPICIOUS") return "#ff9c5b";
  return "#ff6b78";
}

function renderPillars(data) {
  const grid = $("pillarGrid");
  grid.innerHTML = "";
  data.pillars.forEach((value, index) => {
    const state = pillarState(value);
    const display = value === null ? "—" : value.toFixed(2);
    const width = value === null ? 0 : Math.max(0, Math.min(100, value * 100));
    const barColor = value === null ? "#7889a4" : value >= 0.8 ? "#44d6a1" : value >= 0.5 ? "#f4bd62" : "#ff6b78";
    const card = document.createElement("article");
    card.className = "card pillar-card";
    card.innerHTML = `
      <div class="pillar-header"><span class="pillar-number">0${index + 1}</span><span class="pillar-state ${state.className}">${state.label}</span></div>
      <h3>${pillarInfo[index].title}</h3>
      <p>${pillarInfo[index].description}</p>
      <div class="pillar-score"><strong>${display}</strong><span>health</span></div>
      <div class="pillar-bar"><span style="width:${width}%;background:${barColor}"></span></div>
      <small class="pillar-note">${data.notes[index]}</small>`;
    grid.appendChild(card);
  });
}

function renderHistory() {
  const container = $("historyBars");
  container.innerHTML = "";
  const points = history.slice(-12);
  points.forEach((item, index) => {
    const wrap = document.createElement("div");
    wrap.className = "history-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "history-bar";
    bar.style.height = `${Math.max(3, item.score)}%`;
    bar.style.background = `linear-gradient(180deg, ${colorForStatus(item.status)}, #4375c9)`;
    bar.title = `${item.label}: ${item.score}`;
    const label = document.createElement("span");
    label.className = "history-bar-label";
    label.textContent = `#${item.sequence}`;
    wrap.append(bar, label);
    container.appendChild(wrap);
  });
  $("historyCount").textContent = `${history.length} data point${history.length === 1 ? "" : "s"}`;
}

function renderEvents() {
  $("eventCount").textContent = eventLog.length;
  const body = $("eventTable");
  body.innerHTML = "";
  if (!eventLog.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty-cell">No events yet.</td></tr>';
    return;
  }
  eventLog.slice(0, 12).forEach(event => {
    const tr = document.createElement("tr");
    let pillClass = event.status === "CRITICAL" ? "critical" : event.status === "WATCH" || event.status === "SUSPICIOUS" ? "warning" : "";
    tr.innerHTML = `<td>${event.time}</td><td>${event.name}</td><td>${event.score}/100</td><td>${event.classification}</td><td><span class="event-pill ${pillClass}">${event.type}</span></td>`;
    body.appendChild(tr);
  });
}

function addEvent(name, result, classification, type = "SCENARIO") {
  sequence += 1;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour12: false });
  const event = { sequence, time, name, score: result.score, status: result.status, classification, type };
  eventLog.unshift(event);
  history.push({ sequence, score: result.score, status: result.status, label: name });
  history = history.slice(-30);
  renderEvents();
  renderHistory();
}

function renderScenario(key, shouldLog = true) {
  activeScenario = key;
  const data = scenarios[key];
  const result = calculateTrust(data);
  currentResult = { ...result, data, key };

  $("trustScore").textContent = result.score;
  $("scoreGauge").style.setProperty("--score-angle", `${result.score * 3.6}deg`);
  $("scoreGauge").style.setProperty("--gauge-color", colorForStatus(result.status));
  const badge = $("statusBadge");
  badge.textContent = result.status;
  badge.className = `status-badge ${statusClass(result.status)}`;

  const statusCopy = {
    TRUSTED: ["Signals look consistent", "All simulated checks are healthy."],
    WATCH: ["Review signal quality", "One or more checks are reduced; review the inputs."],
    SUSPICIOUS: ["Multiple checks need review", "Synthetic data shows a significant mismatch."],
    CRITICAL: ["Trust is critically low", "This score requests a mock operator response; the cause may still be unknown."]
  };
  $("statusTitle").textContent = statusCopy[result.status][0];
  $("statusText").textContent = statusCopy[result.status][1];
  $("confidenceValue").textContent = result.confidence.toFixed(2);
  $("satellitesValue").textContent = data.satellites;
  $("satelliteTrack").style.width = `${Math.min(100, data.satellites / 12 * 100)}%`;
  $("satelliteNote").textContent = data.satellites >= 12 ? "Good simulated visibility" : data.satellites >= 6 ? "Reduced simulated visibility" : "Low / unavailable simulated visibility";
  $("hdopValue").textContent = data.hdop >= 20 ? "—" : data.hdop.toFixed(1);
  $("hdopTrack").style.width = `${Math.max(4, 100 - Math.min(100, data.hdop * 10))}%`;
  $("hdopNote").textContent = data.hdop <= 2 ? "Good simulated geometry" : data.hdop <= 5 ? "Moderate simulated geometry" : "Poor / unavailable simulated geometry";

  $("flagValue").textContent = data.flag;
  $("flagValue").style.color = data.flag === "NONE" ? "var(--green)" : data.flag === "UNKNOWN" ? "#a7b2c5" : "var(--red)";
  $("flagNote").textContent = data.flag === "NONE" ? "No simulated attack signature" : data.flag === "UNKNOWN" ? "Insufficient data to classify" : "Synthetic signature only";
  $("flagState").textContent = data.flag === "NONE" ? "Monitoring" : data.flag === "UNKNOWN" ? "Needs data" : "Review alert";
  document.querySelector(".flag-foot .tiny-dot").className = `tiny-dot ${data.flag === "NONE" ? "green" : data.flag === "UNKNOWN" ? "" : "red"}`;

  const isCritical = result.status === "CRITICAL";
  $("responseIcon").className = `response-icon ${isCritical ? "critical" : result.status === "WATCH" ? "warn" : ""}`;
  $("responseIcon").textContent = isCritical ? "!" : result.status === "WATCH" ? "!" : "✓";
  $("responseTitle").textContent = isCritical ? "Safe Mode request recommended" : "No action requested";
  $("responseDescription").textContent = isCritical
    ? "Critical score: request shown here is a mock only. No operator or tower is connected."
    : result.status === "WATCH" || result.status === "SUSPICIOUS"
      ? "Review the scenario and inspect the pillar values."
      : "The current score is outside the Critical band.";
  $("latestAlert").textContent = data.flag === "NONE" ? "No alert generated" : `${data.flag} · ${result.status}`;
  $("lastUpdate").textContent = "Just now";

  renderPillars(data);
  document.querySelectorAll(".scenario-btn").forEach(button => {
    button.classList.toggle("selected", button.dataset.scenario === key);
  });
  if (shouldLog) addEvent(data.label, result, data.classification);
}

document.querySelectorAll(".scenario-btn").forEach(button => {
  button.addEventListener("click", () => renderScenario(button.dataset.scenario));
});

$("safeModeBtn").addEventListener("click", () => {
  if (!currentResult) return;
  addEvent("Safe Mode requested (mock)", currentResult, "Local demo action", "MOCK ACTION");
  $("latestAlert").textContent = `MOCK REQUEST #${sequence}`;
  $("responseTitle").textContent = "Mock request recorded";
  $("responseDescription").textContent = "Saved in this browser session only. No external system was contacted.";
  $("responseIcon").className = "response-icon warn";
  $("responseIcon").textContent = "✓";
});

$("clearLogBtn").addEventListener("click", () => {
  eventLog = [];
  history = [];
  renderEvents();
  renderHistory();
});

function updateClock() {
  $("clock").textContent = new Date().toLocaleTimeString([], { hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

// Start in a healthy, clearly labelled synthetic demo state.
renderScenario("normal");
