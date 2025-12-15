// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SHOW_OVERLAY") {
    createOverlay(request.data);
  }
});

function createOverlay(exercise) {
  // Idempotency: Check if overlay already exists
  if (document.getElementById("ergoflow-overlay")) {
    console.log("Overlay already exists. Skipping creation.");
    return;
  }

  // Create Container
  const overlay = document.createElement("div");
  overlay.id = "ergoflow-overlay";

  // HTML Content
  overlay.innerHTML = `
    <div class="ergoflow-card">
      <h1>Time to Reset</h1>
      <div class="ergoflow-anim-placeholder">
        (Animation Placeholder: ${exercise.title})
      </div>
      <h2>${exercise.title}</h2>
      <p>${exercise.instruction}</p>
      <div class="ergoflow-timer">${exercise.duration}s</div>
      <button id="ergoflow-close">I'm Done</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add Event Listener to Close Button
  const closeBtn = document.getElementById("ergoflow-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const existingOverlay = document.getElementById("ergoflow-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
        console.log("Overlay removed by user.");
      }
    });
  }
}
