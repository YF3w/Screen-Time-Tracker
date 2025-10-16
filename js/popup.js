let afficherTout = false;

// Format seconds to human-readable time
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}min ${secs}s`;
  } else if (mins > 0) {
    return `${mins}min ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Display screen time data
function afficherTemps() {
  chrome.storage.local.get("screenTime", (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving screen time:", chrome.runtime.lastError);
      return;
    }
    
    const screenTime = result.screenTime || {};
    const dataDiv = document.getElementById("data");
    if (!dataDiv) return;

    dataDiv.innerHTML = "";

    // Sort sites by time (descending)
    const sitesTries = Object.entries(screenTime)
      .sort((a, b) => b[1] - a[1]);

    const sitesAAfficher = afficherTout ? sitesTries : sitesTries.slice(0, 5);

    for (const [site, seconds] of sitesAAfficher) {
      const line = document.createElement("div");
      line.textContent = `${site} : ${formatTime(seconds)}`;
      dataDiv.appendChild(line);
    }

    // Show/hide "Show more" button
    const btn = document.getElementById("afficherPlusBtn");
    if (btn) {
      if (sitesTries.length <= 5) {
        btn.style.display = "none";
      } else {
        btn.style.display = "block";
        btn.textContent = afficherTout ? "Réduire" : "Afficher plus";
      }
    }
  });
}

// Display weekly graph
function afficherGraphique() {
  const joursOrdre = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
  const totalParJour = {
    lun: { total: 0, count: 0 },
    mar: { total: 0, count: 0 },
    mer: { total: 0, count: 0 },
    jeu: { total: 0, count: 0 },
    ven: { total: 0, count: 0 },
    sam: { total: 0, count: 0 },
    dim: { total: 0, count: 0 }
  };

  chrome.storage.local.get("weeklyScreenTime", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving weekly data:", chrome.runtime.lastError);
      return;
    }
    
    const weeklyData = data.weeklyScreenTime || {};

    // Calculate total and count for each day of the week
    for (const [dateStr, sites] of Object.entries(weeklyData)) {
      const date = new Date(dateStr);
      const jour = date
        .toLocaleDateString("fr-FR", { weekday: "short" })
        .toLowerCase()
        .replace(".", "");
      
      const totalSecondes = Object.values(sites).reduce((a, b) => a + b, 0);

      if (totalParJour.hasOwnProperty(jour)) {
        totalParJour[jour].total += totalSecondes;
        totalParJour[jour].count += 1;
      }
    }

    // Calculate average hours per day
    const heuresParJour = joursOrdre.map(jour => {
      const data = totalParJour[jour];
      if (data.count === 0) return 0;
      const moyenneHeures = (data.total / data.count / 3600).toFixed(2);
      return parseFloat(moyenneHeures);
    });

    // Calculate weekly average
    const totalHeures = heuresParJour.reduce((a, b) => a + b, 0);
    const joursAvecDonnees = heuresParJour.filter(h => h > 0).length;
    const moyenne = joursAvecDonnees > 0 ? (totalHeures / joursAvecDonnees).toFixed(2) : 0;

    // Display average
    const moyenneElem = document.getElementById("moyenne");
    if (moyenneElem) {
      moyenneElem.textContent = `Moyenne hebdomadaire : ${moyenne}h par jour`;
    }

    const ctx = document.getElementById("screenTimeChart");
    if (!ctx) return;

    // Destroy previous chart instance
    if (window.screenChartInstance) {
      window.screenChartInstance.destroy();
    }

    window.screenChartInstance = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [{
          label: "Temps d'écran moyen (heures)",
          data: heuresParJour,
          backgroundColor: "#0A66C2",
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Heures"
            },
            ticks: {
              callback: function(value) {
                return value.toFixed(1) + 'h';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y.toFixed(2) + ' heures';
              }
            }
          }
        }
      }
    });
  });
}

// Update UI based on state
// Update UI based on state
function updateUI(state) {
  // Hide everything first
  const elements = [
    "main-content",
    "consent-container",
    "activer-container",
    "opt",
    "graphContainer"
  ];
  
  elements.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = "none";
  });

  const btnX = document.getElementById("btn-x");
  const btnXContainer = document.querySelector(".btn-x-container");

  // Show appropriate view
  if (state.isFirstInstall) {
    const consent = document.getElementById("consent-container");
    if (consent) consent.style.display = "block";
    if (btnXContainer) btnXContainer.style.display = "none"; // Masquer le bouton options
  } else if (state.consentGiven === false) {
    const activer = document.getElementById("activer-container");
    if (activer) activer.style.display = "block";
    if (btnXContainer) btnXContainer.style.display = "none"; // Masquer le bouton options
  } else if (state.consentGiven === true) {
    // Afficher le bouton options seulement si consentement donné
    if (btnXContainer) btnXContainer.style.display = "block";
    
    if (state.showOptions) {
      // Afficher les options (graphique/suspension)
      const opt = document.getElementById("opt");
      if (opt) opt.style.display = "block";
      
      if (state.showGraph) {
        const graph = document.getElementById("graphContainer");
        if (graph) {
          graph.style.display = "block";
          afficherGraphique();
        }
      }
    } else {
      // Afficher le contenu principal (liste des sites)
      const mainContent = document.getElementById("main-content");
      if (mainContent) mainContent.style.display = "block";
      afficherTemps();
      setInterval(afficherTemps, 1000);
    }
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // TOUJOURS réinitialiser les options au démarrage
  chrome.storage.local.set({ btnClicked: false, tsClicked: false }, () => {
    
    // Load consent state
    chrome.storage.local.get([
      "consentGiven",
      "isFirstInstall"
    ], (result) => {
      const state = {
        consentGiven: result.consentGiven,
        isFirstInstall: result.isFirstInstall,
        showOptions: false,  // Toujours commencer par l'écran principal
        showGraph: false
      };

      updateUI(state);
    });
  });

  // "Show more" button handler
  const afficherPlusBtn = document.getElementById("afficherPlusBtn");
  if (afficherPlusBtn) {
    afficherPlusBtn.addEventListener("click", () => {
      afficherTout = !afficherTout;
      afficherTemps();
    });
  }

  // Accept consent
  const acceptBtn = document.getElementById("accept");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      chrome.storage.local.set({ 
        consentGiven: true, 
        isFirstInstall: false,
        btnClicked: false,
        tsClicked: false
      }, () => {
        setTimeout(() => location.reload(), 300);
      });
    });
  }

  // Decline consent
  const declineBtn = document.getElementById("decline");
  if (declineBtn) {
    declineBtn.addEventListener("click", () => {
      chrome.storage.local.set({ 
        consentGiven: false, 
        isFirstInstall: false 
      }, () => {
        location.reload();
      });
    });
  }

  // Reactivate tracking
  const activerBtn = document.getElementById("activer");
  if (activerBtn) {
    activerBtn.addEventListener("click", () => {
      chrome.storage.local.set({ 
        consentGiven: true,
        btnClicked: false,
        tsClicked: false
      }, () => {
        setTimeout(() => location.reload(), 300);
      });
    });
  }

  // Options button (btn-x)
  const btnX = document.getElementById("btn-x");
  if (btnX) {
    btnX.addEventListener("click", () => {
      chrome.storage.local.get("btnClicked", (result) => {
        const newState = !(result.btnClicked === true);
        
        chrome.storage.local.set({ 
          btnClicked: newState,
          tsClicked: false // Reset graph when toggling options
        }, () => {
          // Update UI without reload for smoother UX
          chrome.storage.local.get([
            "consentGiven",
            "isFirstInstall"
          ], (result) => {
            const state = {
              consentGiven: result.consentGiven,
              isFirstInstall: result.isFirstInstall,
              showOptions: newState,
              showGraph: false
            };
            updateUI(state);
          });
        });
      });
    });
  }

  // Weekly graph button
  const tsBtn = document.getElementById("ts");
  if (tsBtn) {
    tsBtn.addEventListener("click", () => {
      chrome.storage.local.get("tsClicked", (result) => {
        const newState = !(result.tsClicked === true);
        chrome.storage.local.set({ tsClicked: newState }, () => {
          const graphContainer = document.getElementById("graphContainer");
          const moyenne = document.getElementById("moyenne");
          const suspendre = document.getElementById("suspendre");
          
          if (graphContainer) graphContainer.style.display = newState ? "block" : "none";
          if (moyenne) moyenne.style.display = newState ? "block" : "none";
          if (suspendre) suspendre.style.display = newState ? "none" : "block";
          
          if (newState) afficherGraphique();
        });
      });
    });
  }

  // Suspend/Resume tracking
  const suspendreBtn = document.getElementById("suspendre");
  if (suspendreBtn) {
    chrome.storage.local.get("trackingSuspended", (data) => {
      const isSuspended = data.trackingSuspended === true;
      suspendreBtn.textContent = isSuspended ? "Réactiver le suivi" : "Suspendre le suivi";
    });

    suspendreBtn.addEventListener("click", () => {
      chrome.storage.local.get("trackingSuspended", (data) => {
        const newState = !(data.trackingSuspended === true);
        chrome.storage.local.set({ trackingSuspended: newState }, () => {
          suspendreBtn.textContent = newState ? "Réactiver le suivi" : "Suspendre le suivi";
        });
      });
    });
  }
});

// Optional: Reset on window close for extra safety
window.addEventListener("beforeunload", () => {
  chrome.storage.local.set({ 
    btnClicked: false, 
    tsClicked: false 
  });
});