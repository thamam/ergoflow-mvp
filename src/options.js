const defaultSettings = {
    mode: 'simple',
    simpleInterval: 45,
    fixedMinutes: [25, 55],
    anchoredStart: '09:00',
    anchoredInterval: 10
};

// Toggle UI sections based on mode selection
document.getElementById('mode').addEventListener('change', (e) => {
    const mode = e.target.value;
    document.querySelectorAll('.mode-group').forEach(el => el.style.display = 'none');

    if (mode === 'simple') document.getElementById('simple-options').style.display = 'block';
    if (mode === 'fixed') document.getElementById('fixed-options').style.display = 'block';
    if (mode === 'anchored') document.getElementById('anchored-options').style.display = 'block';
});

// Save settings
const saveOptions = () => {
    const mode = document.getElementById('mode').value;
    const settings = { mode };

    if (mode === 'simple') {
        const val = parseFloat(document.getElementById('simple-interval').value);
        if (!val || val <= 0) return showStatus('Invalid interval', 'red');
        settings.simpleInterval = val;
    }

    if (mode === 'fixed') {
        const val = document.getElementById('fixed-minutes').value;
        const mins = val.split(',').map(m => parseInt(m.trim())).filter(n => !isNaN(n) && n >= 0 && n < 60);
        if (mins.length === 0) return showStatus('Invalid minutes format', 'red');
        settings.fixedMinutes = mins;
    }

    if (mode === 'anchored') {
        const start = document.getElementById('anchored-start').value; // HH:MM
        const interval = parseInt(document.getElementById('anchored-interval').value);
        if (!start || !interval || interval <= 0) return showStatus('Invalid start time or interval', 'red');
        settings.anchoredStart = start;
        settings.anchoredInterval = interval;
    }

    chrome.storage.sync.set(settings, () => showStatus('Options saved. Scheduler updated.', '#27ae60'));
};

const showStatus = (msg, color) => {
    const status = document.getElementById('status');
    status.textContent = msg;
    status.style.color = color;
    setTimeout(() => status.textContent = '', 2000);
};

// Restore settings
const restoreOptions = () => {
    chrome.storage.sync.get(defaultSettings, (items) => {
        document.getElementById('mode').value = items.mode;
        document.getElementById('simple-interval').value = items.simpleInterval;
        document.getElementById('fixed-minutes').value = items.fixedMinutes.join(', ');
        document.getElementById('anchored-start').value = items.anchoredStart;
        document.getElementById('anchored-interval').value = items.anchoredInterval;

        // Trigger change to update UI
        document.getElementById('mode').dispatchEvent(new Event('change'));
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
