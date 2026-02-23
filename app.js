// ---------- Horloge néon ----------
function updateClock() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("clock-date");

  if (!clockEl || !dateEl) return;

  clockEl.textContent = `${hours}:${minutes}:${seconds}`;

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  dateEl.textContent = formatter.format(now);
}

setInterval(updateClock, 1000);
updateClock();

// ---------- Pomodoro circulaire ----------
const FULL_CIRCUMFERENCE = 2 * Math.PI * 50; // r = 50 dans le SVG

let pomodoroDuration = 25 * 60; // en secondes
let remainingSeconds = pomodoroDuration;
let pomodoroInterval = null;
let isRunning = false;
let currentModeLabel = "Focus";

const progressCircle = document.getElementById("pomodoro-progress");
const timeEl = document.getElementById("pomodoro-time");
const labelEl = document.getElementById("pomodoro-label");
const toggleBtn = document.getElementById("pomodoro-toggle");
const resetBtn = document.getElementById("pomodoro-reset");
const modeButtons = document.querySelectorAll(".pomodoro-mode-btn");

if (progressCircle) {
  progressCircle.style.strokeDasharray = String(FULL_CIRCUMFERENCE);
  progressCircle.style.strokeDashoffset = String(FULL_CIRCUMFERENCE);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updatePomodoroUI() {
  if (timeEl) timeEl.textContent = formatTime(remainingSeconds);

  const ratio = remainingSeconds / pomodoroDuration;
  const offset = FULL_CIRCUMFERENCE * (1 - ratio);

  if (progressCircle) {
    progressCircle.style.strokeDashoffset = String(offset);
  }

  if (labelEl) labelEl.textContent = currentModeLabel;
}

function startPomodoro() {
  if (isRunning) return;
  isRunning = true;
  toggleBtn.textContent = "Pause";

  pomodoroInterval = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updatePomodoroUI();
      clearInterval(pomodoroInterval);
      isRunning = false;
      toggleBtn.textContent = "Démarrer";

      // Petit flash visuel (optionnel)
      document.body.classList.add("bg-finished-flash");
      setTimeout(() => {
        document.body.classList.remove("bg-finished-flash");
      }, 600);
    } else {
      updatePomodoroUI();
    }
  }, 1000);
}

function pausePomodoro() {
  isRunning = false;
  toggleBtn.textContent = "Démarrer";
  if (pomodoroInterval) clearInterval(pomodoroInterval);
}

function resetPomodoro(durationMinutes = null, label = null) {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  isRunning = false;
  toggleBtn.textContent = "Démarrer";

  if (durationMinutes !== null) {
    pomodoroDuration = durationMinutes * 60;
    currentModeLabel = label || "Focus";
  }

  remainingSeconds = pomodoroDuration;
  updatePomodoroUI();
}

// Bouton start/pause
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (isRunning) {
      pausePomodoro();
    } else {
      startPomodoro();
    }
  });
}

// Bouton reset
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    resetPomodoro();
  });
}

// Boutons de mode
modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const minutes = parseInt(btn.getAttribute("data-duration") || "25", 10);

    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    let label = "Focus";
    if (minutes === 5) label = "Pause";
    else if (minutes === 15) label = "Long break";

    resetPomodoro(minutes, label);
  });
});

// Initialisation
updatePomodoroUI();

// ---------- Notes avec sauvegarde ----------
const NOTES_KEY = "zen-dashboard-notes";
const notesArea = document.getElementById("notes");
const notesStatus = document.getElementById("notes-status");
const notesCount = document.getElementById("notes-count");
const notesClearBtn = document.getElementById("notes-clear");

function loadNotes() {
  if (!notesArea) return;
  const saved = localStorage.getItem(NOTES_KEY);
  if (saved !== null) {
    notesArea.value = saved;
  }
  updateNotesMeta();
}

function saveNotes() {
  if (!notesArea) return;
  localStorage.setItem(NOTES_KEY, notesArea.value);
  if (notesStatus) {
    notesStatus.textContent = "Synchronisé.";
    notesStatus.style.color = "rgba(190,242,100,0.9)";
    setTimeout(() => {
      notesStatus.style.color = "rgba(148,163,184,0.7)";
    }, 600);
  }
  updateNotesMeta();
}

function updateNotesMeta() {
  if (!notesArea) return;
  const length = notesArea.value.length;
  if (notesCount) {
    notesCount.textContent = `${length} caractère${length > 1 ? "s" : ""}`;
  }
}

// Sauvegarde au fil de la saisie (debounce léger)
let notesTimeout = null;

if (notesArea) {
  notesArea.addEventListener("input", () => {
    if (notesStatus) {
      notesStatus.textContent = "Enregistrement...";
      notesStatus.style.color = "rgba(248,250,252,0.9)";
    }
    if (notesTimeout) clearTimeout(notesTimeout);
    notesTimeout = setTimeout(saveNotes, 400);
    updateNotesMeta();
  });
}

// Bouton effacer
if (notesClearBtn && notesArea) {
  notesClearBtn.addEventListener("click", () => {
    notesArea.value = "";
    saveNotes();
  });
}

// Charger à l'ouverture
loadNotes();
