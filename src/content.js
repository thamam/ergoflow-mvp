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
      
      <div class="ergoflow-media-container" id="ergoflow-media-root">
        <!-- Video will be injected here via JS to handle events better, 
             or we can put it here directly. Let's put a spinner initially. -->
        <div class="ergoflow-loading">Loading animation...</div>
      </div>

      <h2>${exercise.title}</h2>
      <p>${exercise.instruction}</p>
      <div class="ergoflow-timer">${exercise.duration}s</div>
      <button id="ergoflow-close">I'm Done</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Video Logic
  const mediaRoot = document.getElementById("ergoflow-media-root");
  if (mediaRoot && exercise.video_url) {
    const video = document.createElement("video");
    video.src = exercise.video_url;
    video.className = "ergoflow-video";
    video.autoplay = true;
    video.loop = true;
    video.muted = true; // Required for autoplay
    video.playsInline = true;

    // Cross-origin attribute might be needed if serving from different origin, 
    // but usually not for simple playback unless capturing frames.
    // video.crossOrigin = "anonymous"; 

    video.onloadeddata = () => {
      // Clear loading text and show video
      mediaRoot.innerHTML = "";
      mediaRoot.appendChild(video);
    };

    video.onerror = () => {
      console.error("ErgoFlow: Video failed to load", video.error);
      mediaRoot.innerHTML = `
        <div class="ergoflow-video-error">
          <p>⚠️ Animation unavailable</p>
        </div>
      `;
    };

    // Append immediately to start loading (but it might show briefly before onloadeddata fires if we don't hide it, 
    // actually replacing innerHTML in onloadeddata is safer to avoid flashing)
    // However, onloadeddata might not fire if not attached. 
    // Let's attach it but hidden? Or just handle the "loading" state by replacing content.
    // Better approach:
    // 1. Clear root.
    // 2. Append video.
    // 3. If it fails, replacing handling.

    // Simpler Re-implementation for robustness:
    mediaRoot.innerHTML = "";
    mediaRoot.appendChild(video);
  } else if (mediaRoot) {
    // No video URL fallback
    mediaRoot.innerHTML = `
        <div class="ergoflow-video-error">
          <p>No animation provided</p>
        </div>
      `;
  }

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
