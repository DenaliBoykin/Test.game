const pauseBtn = document.getElementById("pauseBtn");
const statusEl = document.getElementById("status");

function updatePauseUI() {
  if (statusEl.textContent.startsWith("Game Over")) {
    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = true;
    return;
  }

  pauseBtn.disabled = false;
  pauseBtn.textContent = window.__runnerPaused ? "Resume" : "Pause";
}

function togglePause() {
  if (statusEl.textContent.startsWith("Game Over")) {
    return;
  }

  window.__runnerPaused = !window.__runnerPaused;
  statusEl.textContent = window.__runnerPaused ? "Paused" : "Running";
  updatePauseUI();
}

pauseBtn.addEventListener("click", togglePause);

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") {
    e.preventDefault();
    togglePause();
  }
});

const observer = new MutationObserver(updatePauseUI);
observer.observe(statusEl, { childList: true, subtree: true, characterData: true });

updatePauseUI();
