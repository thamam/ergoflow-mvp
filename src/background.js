```javascript
// State variables
const ALARM_NAME = "break_alarm";
const DEFAULT_DURATION = 45;
const DEFAULT_SETTINGS = {
  mode: 'simple',
  simpleInterval: 45,
  fixedMinutes: [25, 55],
  anchoredStart: '09:00',
  anchoredInterval: 10
};

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("ErgoFlow Installed.");
  updateTimerFromStorage();
});

// Update timer when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    console.log("Settings changed. Rescheduling...");
    updateTimerFromStorage();
  }
});

// Helper: Get duration from storage and start timer
function updateTimerFromStorage() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    updateTimer(items); // items is the full settings object
  });
}

// Scheduler Logic
function updateTimer(settings) {
  // Clear existing alarm
  chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
    if (wasCleared) console.log("Previous alarm cleared.");

    // Retrieve full settings or use defaults if partial
    console.log("Rescheduling with mode:", settings.mode);

    // Calculate Next Trigger Time
    const nextTimestamp = calculateNextTrigger(settings);

    if (nextTimestamp) {
      // Calculate delay in minutes from now
      const delayInMinutes = (nextTimestamp - Date.now()) / 1000 / 60;
      console.log(`Next alarm scheduled for ${ new Date(nextTimestamp).toLocaleTimeString() }(in ${ delayInMinutes.toFixed(2) } mins).`);

      // Schedule ONE-TIME alarm. The alarm handler will reschedule the next one.
      chrome.alarms.create(ALARM_NAME, {
        when: nextTimestamp
      });
    } else {
      console.error("Could not calculate next trigger time.");
    }
  });
}

function calculateNextTrigger(settings) {
  const now = new Date();
  const mode = settings.mode || 'simple';

  if (mode === 'simple') {
    const interval = settings.simpleInterval || DEFAULT_DURATION;
    return Date.now() + (interval * 60 * 1000);
  }

  if (mode === 'fixed') {
    const minutes = settings.fixedMinutes || [25, 55];
    minutes.sort((a, b) => a - b);

    for (let m of minutes) {
      let candidate = new Date(now);
      candidate.setMinutes(m, 0, 0);
      if (candidate > now) return candidate.getTime();
    }
    // If no future minute found in current hour, pick first minute of next hour
    let candidate = new Date(now);
    candidate.setHours(candidate.getHours() + 1);
    candidate.setMinutes(minutes[0], 0, 0);
    return candidate.getTime();
  }

  if (mode === 'anchored') {
    // Parse start time "13:45"
    const [h, m] = (settings.anchoredStart || "09:00").split(':').map(Number);
    const interval = settings.anchoredInterval || 45; // Minutes

    // Start date object
    let start = new Date(now);
    start.setHours(h, m, 0, 0);

    // If start is in future, that is the next trigger
    if (start > now) return start.getTime();

    // Otherwise, add intervals until we pass 'now'
    const intervalMs = interval * 60 * 1000;
    const diff = now - start;
    const intervalsPassed = Math.ceil(diff / intervalMs);

    // Next trigger
    const nextTime = start.getTime() + (intervalsPassed * intervalMs);

    // If calculated time is now or in past, add another interval
    return nextTime <= now.getTime() ? nextTime + intervalMs : nextTime;
  }

  return Date.now() + (DEFAULT_DURATION * 60 * 1000); // Fallback
}

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    triggerBreak();
  }
});

// Trigger the Overlay with Robust Injection
async function triggerBreak() {
  console.log("ALARM FIRED! Finding a suitable tab...");

  try {
    // Strategy 1: Active tab in last focused window
    let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    // Strategy 2: Any active tab in any window
    if (!tabs || tabs.length === 0) {
      console.log("Strategy 1 failed. Trying any active tab...");
      tabs = await chrome.tabs.query({ active: true });
    }

    // Strategy 3: Any tab that is a valid web page (fallback for testing)
    if (!tabs || tabs.length === 0) {
      console.log("Strategy 2 failed. Finding ANY valid http/https tab...");
      tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    }

    if (!tabs || tabs.length === 0) {
      console.log("No suitable tabs found.");
      return;
    }

    // Pick the first valid one
    const activeTab = tabs.find(t => t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("edge://")) || tabs[0];

    if (!activeTab || !activeTab.id) {
      console.log("Invalid tab found:", activeTab);
      return;
    }

    // Safety Check: Ignore internal browser pages (double check)
    if (!activeTab.url || activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("edge://")) {
      console.log("Skipping system page:", activeTab.url);
      return;
    }

    // Dynamic Injection
    console.log(`Injecting script into tab ${ activeTab.id } (${ activeTab.title })...`);

    await chrome.scripting.insertCSS({
      target: { tabId: activeTab.id },
      files: ["src/styles.css"]
    });

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["src/content.js"]
    });

    console.log("Injection successful. Sending SHOW_OVERLAY message...");

    // Send Message
    await chrome.tabs.sendMessage(activeTab.id, {
      action: "SHOW_OVERLAY",
      data: getRandomExercise()
    });

    console.log("Message sent successfully.");

  } catch (error) {
    console.error("Error during break trigger:", error);
  }
}

// Mock Data Provider
function getRandomExercise() {
  const exercises = [
    { id: 1, title: "Neck Rotations", instruction: "Slowly rotate your neck clockwise for 10 seconds.", duration: 15 },
    { id: 2, title: "Wrist Stretch", instruction: "Extend your arm and pull your fingers back gently.", duration: 15 },
    { id: 3, title: "Eye Palming", instruction: "Rub hands together and place warm palms over closed eyes.", duration: 20 }
  ];
  return exercises[Math.floor(Math.random() * exercises.length)];
}
