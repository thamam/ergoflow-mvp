// State variables
const ALARM_NAME = "break_alarm";
const WORK_SESSION_MINUTES = 45; // Production value

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("ErgoFlow Installed. Starting timer.");
  startTimer();
});

// Timer Logic
function startTimer() {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: WORK_SESSION_MINUTES,
    periodInMinutes: WORK_SESSION_MINUTES // Set period to auto-repeat for testing
  });
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
    console.log(`Injecting script into tab ${activeTab.id} (${activeTab.title})...`);

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
