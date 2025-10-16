function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// Save current day's data to weekly storage
function saveCurrentDayData() {
  const todayKey = new Date().toISOString().split("T")[0];
  
  chrome.storage.local.get(["screenTime", "weeklyScreenTime"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error saving data:", chrome.runtime.lastError);
      return;
    }
    
    const screenTime = data.screenTime || {};
    const weeklyScreenTime = data.weeklyScreenTime || {};
    
    // Only save if there's data
    if (Object.keys(screenTime).length > 0) {
      weeklyScreenTime[todayKey] = { ...screenTime };
      
      chrome.storage.local.set({ weeklyScreenTime }, () => {
        console.log("Daily data saved for:", todayKey);
      });
    }
  });
}

// Reset screen time if it's a new day
function resetIfNewDay(callback) {
  const today = new Date().toDateString();

  chrome.storage.local.get(["lastReset", "screenTime"], (data) => {
    const lastReset = data.lastReset;

    if (!lastReset) {
      chrome.storage.local.set({ lastReset: today }, callback);
    } else if (lastReset !== today) {
      // SAVE BEFORE RESETTING
      saveCurrentDayData();
      
      chrome.storage.local.set({
        screenTime: {},
        lastReset: today
      }, callback);
    } else {
      callback();
    }
  });
}

// Track time on active tab
function trackTime() {
  chrome.windows.getCurrent({ populate: false }, (window) => {
    if (!window || !window.focused) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;

      const tab = tabs[0];
      if (!tab.url || 
          tab.url.startsWith("chrome://") || 
          tab.url.startsWith("chrome-extension://")) return;

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

// Clean up old data (keep only last 30 days)
function cleanupOldData() {
  chrome.storage.local.get("weeklyScreenTime", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error during cleanup:", chrome.runtime.lastError);
      return;
    }
    
    const weeklyData = data.weeklyScreenTime || {};
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const cleanedData = {};

    Object.keys(weeklyData).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date >= thirtyDaysAgo) {
        cleanedData[dateStr] = weeklyData[dateStr];
      }
    });

    chrome.storage.local.set({ weeklyScreenTime: cleanedData }, () => {
      console.log("Old data cleaned up");
    });
  });
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  // Create main tracking alarm
  chrome.alarms.create("trackScreenTime", { periodInMinutes: 1 / 60 });
  
  // Create hourly save alarm
  chrome.alarms.create("saveHourly", { periodInMinutes: 60 });
  
  // Create daily cleanup alarm
  chrome.alarms.create("cleanup", { periodInMinutes: 24 * 60 });
  
  if (details.reason === "install") {
    chrome.storage.local.set({
      isFirstInstall: true,
      consentGiven: null
    });
  }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("trackScreenTime", { periodInMinutes: 1 / 60 });
  chrome.alarms.create("saveHourly", { periodInMinutes: 60 });
  chrome.alarms.create("cleanup", { periodInMinutes: 24 * 60 });
});

// Consolidated alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "trackScreenTime":
      chrome.storage.local.get("trackingSuspended", (result) => {
        if (result.trackingSuspended !== true) {
          trackTime();
        }
      });
      break;
      
    case "saveHourly":
      saveCurrentDayData();
      break;
      
    case "cleanup":
      cleanupOldData();
      break;
  }
});