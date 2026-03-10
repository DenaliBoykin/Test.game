const pauseBtn = document.getElementById("pauseBtn");

function syncPauseButton(paused, gameOver) {
  if (gameOver) {
    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = true;
    return;
  }

  pauseBtn.disabled = false;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
}

pauseBtn.addEventListener("click", () => {
  if (!window.runnerGame) {
    return;
  }

  window.runnerGame.togglePause();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && window.runnerGame) {
    e.preventDefault();
    window.runnerGame.togglePause();
  }
});

window.addEventListener("runner:state", (e) => {
  const { paused, gameOver } = e.detail;
  syncPauseButton(paused, gameOver);
});
