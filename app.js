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

// ---------- Mood & musique Lo-Fi ----------
const MOOD_STORAGE_KEY = "zen-dashboard-mood";

// Musiques libres (SoundHelix, CC – attribution sur soundhelix.com)
// Tu peux remplacer par tes propres liens (Pixabay, etc.).
const MOODS = [
  {
    id: "silence",
    label: "Silence",
    description: "Aucune musique",
    source: null
  },
  {
    id: "lofi-chill",
    label: "Lo-Fi Chill",
    description: "Ambiance chill pour se concentrer",
    source: {
      type: "audio",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    }
  },
  {
    id: "lofi-night",
    label: "Lo-Fi Night",
    description: "Ambiance nocturne douce",
    source: {
      type: "audio",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    }
  }
];

const ambientAudio = document.getElementById("ambient-audio");
const moodToggleBtn = document.getElementById("mood-toggle");
const moodMenu = document.getElementById("mood-menu");
const moodCurrentLabelEl = document.getElementById("mood-current-label");

function getMoodById(id) {
  return MOODS.find((m) => m.id === id) || MOODS[0];
}

function setMood(id, options = {}) {
  const { autoPlay = true } = options;
  if (!ambientAudio) return;

  const mood = getMoodById(id);

  // Mise à jour du localStorage
  try {
    localStorage.setItem(MOOD_STORAGE_KEY, mood.id);
  } catch {
    // ignore
  }

  // Mise à jour du label courant
  if (moodCurrentLabelEl) {
    moodCurrentLabelEl.textContent = mood.label;
  }

  // Mise à jour de l'état visuel dans le menu
  if (moodMenu) {
    const items = moodMenu.querySelectorAll("[data-mood-id]");
    items.forEach((el) => {
      if (el.getAttribute("data-mood-id") === mood.id) {
        el.classList.add("bg-cyan-500/20", "text-cyan-100");
      } else {
        el.classList.remove("bg-cyan-500/20", "text-cyan-100");
      }
    });
  }

  // Gestion de la source audio
  if (!mood.source || mood.source.type !== "audio" || !mood.source.url) {
    ambientAudio.pause();
    ambientAudio.removeAttribute("src");
    ambientAudio.load();
    return;
  }

  const newUrl = mood.source.url;
  const isNewSource = !ambientAudio.src || !ambientAudio.src.includes(newUrl);

  if (isNewSource) {
    ambientAudio.src = newUrl;
    if (autoPlay) {
      const onCanPlay = () => {
        ambientAudio.removeEventListener("canplay", onCanPlay);
        ambientAudio.play().catch(() => {});
      };
      ambientAudio.addEventListener("canplay", onCanPlay);
      ambientAudio.load();
    }
  } else if (autoPlay) {
    ambientAudio.play().catch(() => {});
  }
}

function toggleMoodMenu() {
  if (!moodMenu) return;
  moodMenu.classList.toggle("hidden");
}

function closeMoodMenu() {
  if (!moodMenu) return;
  if (!moodMenu.classList.contains("hidden")) {
    moodMenu.classList.add("hidden");
  }
}

function buildMoodMenu() {
  if (!moodMenu) return;
  moodMenu.innerHTML = "";

  MOODS.forEach((mood) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-mood-id", mood.id);
    btn.className =
      "w-full text-left px-3 py-2 bg-transparent text-slate-200/90 hover:bg-cyan-500/15 hover:text-cyan-100/95 border-b border-slate-700/50 last:border-b-0 transition flex flex-col gap-0.5";
    btn.innerHTML = `
      <span class="text-[11px] font-semibold uppercase tracking-[0.16em]">
        ${mood.label}
      </span>
      ${
        mood.description
          ? `<span class="text-[10px] text-slate-400/90 normal-case tracking-normal">
               ${mood.description}
             </span>`
          : ""
      }
    `;

    btn.addEventListener("click", () => {
      setMood(mood.id, { autoPlay: true });
      closeMoodMenu();
    });

    moodMenu.appendChild(btn);
  });
}

function initMoodFeature() {
  if (!ambientAudio || !moodToggleBtn || !moodMenu) return;

  ambientAudio.loop = true;
  buildMoodMenu();

  // Récupérer le dernier mood choisi
  let initialMoodId = "silence";
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (stored && getMoodById(stored)) {
      initialMoodId = stored;
    }
  } catch {
    // ignore
  }

  // On applique le mood mais sans forcer l'autoplay au premier chargement
  setMood(initialMoodId, { autoPlay: false });

  // Ouverture / fermeture du menu
  moodToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMoodMenu();
  });

  // Fermer le menu si on clique ailleurs
  document.addEventListener("click", (event) => {
    if (!moodMenu) return;
    if (
      !moodMenu.contains(event.target) &&
      !moodToggleBtn.contains(event.target)
    ) {
      closeMoodMenu();
    }
  });
}

initMoodFeature();
