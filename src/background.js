// State variables
const ALARM_NAME = "break_alarm";
const WORK_SESSION_MINUTES = 45;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("ErgoFlow Installed. Starting timer.");
  startTimer();
});

// Timer Logic
function startTimer() {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: WORK_SESSION_MINUTES
  });
}

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    triggerBreak();
  }
});

// Trigger the Overlay
function triggerBreak() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    
    // Send message to content script
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "SHOW_OVERLAY",
      data: getRandomExercise()
    }).catch(err => console.log("Content script not ready on this tab"));
  });
}

// Mock Data Provider (Simulating the JSON fetch)
function getRandomExercise() {
  const exercises = [
    { id: 1, title: "Neck Rotations", instruction: "Slowly rotate your neck clockwise for 10 seconds.", duration: 15 },
    { id: 2, title: "Wrist Stretch", instruction: "Extend your arm and pull your fingers back gently.", duration: 15 },
    { id: 3, title: "Eye Palming", instruction: "Rub hands together and place warm palms over closed eyes.", duration: 20 }
  ];
  return exercises[Math.floor(Math.random() * exercises.length)];
}
