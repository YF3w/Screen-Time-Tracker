function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function resetIfNewDay(callback) {
  const today = new Date().toDateString();

  chrome.storage.local.get(["lastReset", "screenTime"], (data) => {
    const lastReset = data.lastReset;

    if (!lastReset) {
      chrome.storage.local.set({ lastReset: today }, callback);
    } else if (lastReset !== today) {
      chrome.storage.local.set({
        screenTime: {},
        lastReset: today
      }, callback);
    } else {
      callback();
    }
  });
}

// Fonction appelée toutes les secondes (appelée UNIQUEMENT si suivi actif)
function trackTime() {
  chrome.windows.getCurrent({ populate: false }, (window) => {
    if (!window.focused) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;

      const domain = getDomain(tab.url);
      if (!domain) return;

      resetIfNewDay(() => {
        chrome.storage.local.get("screenTime", (data) => {
          const screenTime = data.screenTime || {};
          screenTime[domain] = (screenTime[domain] || 0) + 1;
          chrome.storage.local.set({ screenTime });
        });
      });
    });
  });
}

// Création de l'alarme au démarrage
/*
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("trackScreenTime", { periodInMinutes: 1 / 60 });
  chrome.storage.local.set({ consentGiven: null });

});
*/

chrome.runtime.onInstalled.addListener((details) => {

  chrome.alarms.create("trackScreenTime", { periodInMinutes: 1 / 60 });
  if (details.reason === "install") {
    chrome.storage.local.set({
      isFirstInstall: true,
      consentGiven: null // forcer le consentement à être demandé
    });
  }
});


chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("trackScreenTime", { periodInMinutes: 1 / 60 });
});

// Quand l'alarme se déclenche
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "trackScreenTime") {
    chrome.storage.local.get("trackingSuspended", (result) => {
      if (result.trackingSuspended === true) return; // Ne pas suivre si suspendu
      trackTime();
    });
  }
});

/***************************Enregistrement pour le graphique *******************************/
function cleanupOldData() {
  chrome.storage.local.get("weeklyScreenTime", (data) => {
    const weeklyData = data.weeklyScreenTime || {};
    const today = new Date();

    const cleanedData = {};

    Object.keys(weeklyData).forEach(dateStr => {
      const date = new Date(dateStr);
      const diffDays = (today - date) / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) {
        cleanedData[dateStr] = weeklyData[dateStr];
      }
    });

    chrome.storage.local.set({ weeklyScreenTime: cleanedData });
  });
}
