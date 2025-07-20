let afficherTout = false;

function afficherTemps() {
  chrome.storage.local.get("screenTime", (result) => {
    const screenTime = result.screenTime || {};
    const dataDiv = document.getElementById("data");
    if (!dataDiv) return;

    dataDiv.innerHTML = "";

    // Trier les sites par temps décroissant
    const sitesTries = Object.entries(screenTime)
      .sort((a, b) => b[1] - a[1]);

    const sitesAAfficher = afficherTout ? sitesTries : sitesTries.slice(0, 5);

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}min ${secs}s`;
  } else {
    return `${mins}min ${secs}s`;
  }
}

for (const [site, seconds] of sitesAAfficher) {
  const line = document.createElement("div");
  line.textContent = `${site} : ${formatTime(seconds)}`;
  dataDiv.appendChild(line);
}



    // Afficher ou masquer le bouton selon le nombre total de sites
    const btn = document.getElementById("afficherPlusBtn");
    if (sitesTries.length <= 5) {
      btn.style.display = "none";
    } else {
      btn.style.display = "block";
      btn.textContent = afficherTout ? "Réduire" : "Afficher plus";
    }
  });
}

// Gérer le bouton
document.addEventListener("DOMContentLoaded", () => {

  // Réinitialise l'affichage par défaut à l'ouverture
  document.getElementById("main-content").style.display = "block";

  const graph = document.getElementById("graphContainer");
  if (graph) graph.style.display = "none";

  const consent = document.getElementById("consent-container");
  if (consent) consent.style.display = "none";

  const activer = document.getElementById("activer-container");
  if (activer) activer.style.display = "none";

  const opt = document.getElementById("opt");
  if (opt) opt.style.display = "none"; // <-- ajoute cette vérification
  document.getElementById("afficherPlusBtn").addEventListener("click", () => {
    afficherTout = !afficherTout;
    afficherTemps();
  });
  afficherTemps(); // Affichage initial
  setInterval(afficherTemps, 1000); // Met à jour toutes les secondes

  // Recharge le popup toutes les 10 secondes pour éviter les bugs
  /*setInterval(() => {
    location.reload();
  }, 10000);*/
});

// Vérifie le consentement
/*
chrome.storage.local.get("consentGiven", (result) => {
  if (result.consentGiven === true) {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("consent-container").style.display = "none";
    document.getElementById("activer-container").style.display = "none";
    document.getElementById("btn-x").style.display = "block";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";


  } else if (result.consentGiven === false) {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("activer-container").style.display = "block";
    document.getElementById("consent-container").style.display = "none";
    document.getElementById("btn-x").style.display = "none";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";
  } else{ 
    // consentement pas encore donné
    document.getElementById("main-content").style.display = "none";
    document.getElementById("consent-container").style.display = "block";
    document.getElementById("activer-container").style.display = "none";
    document.getElementById("btn-x").style.display = "block";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";
  }
});
*/

chrome.storage.local.get(["consentGiven", "isFirstInstall"], (result) => {
  console.log("Stockage récupéré :", result);
  const { consentGiven, isFirstInstall } = result;

  if (isFirstInstall) {
    // Affiche le conteneur de consentement au premier lancement
    document.getElementById("consent-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
    document.getElementById("btn-x").style.display = "block";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";
    document.getElementById("activer-container").style.display = "none";
  } else if (consentGiven === true) {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("consent-container").style.display = "none";
    document.getElementById("btn-x").style.display = "block";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";
    document.getElementById("activer-container").style.display = "none";
    afficherTemps();
    setInterval(afficherTemps, 10000);
  } else {
    // consentement refusé
    document.getElementById("main-content").style.display = "none";
    document.getElementById("consent-container").style.display = "none";
    document.getElementById("activer-container").style.display = "block";
    document.getElementById("btn-x").style.display = "block";
    document.getElementById("opt").style.display = "none";
    document.getElementById("graphContainer").style.display = "none";
  }
});

// Si l'utilisateur accepte
document.getElementById("accept")?.addEventListener("click", () => {
  chrome.storage.local.set({ consentGiven: true, isFirstInstall: false }, () => {
    setTimeout(() => {
      location.reload();
    }, 500);
  });
});

// Si l'utilisateur refuse
document.getElementById("decline")?.addEventListener("click", () => {
  chrome.storage.local.set({ consentGiven: false, isFirstInstall: false }, () => {
    location.reload();
  });
});

// S’il change d’avis plus tard
document.getElementById("activer")?.addEventListener("click", () => {
  chrome.storage.local.set({ consentGiven: true }, () => {
    setTimeout(() => {
      location.reload();
    }, 500);
  });
});





/***************************Btn-x*******************************/

// État initial par défaut
chrome.storage.local.get("btnClicked", (result) => {
  const isClicked = result.btnClicked === true;

  toggleDisplay(isClicked);
});

// Gère le clic sur le bouton
document.getElementById("btn-x")?.addEventListener("click", () => {
  chrome.storage.local.get("btnClicked", (result) => {
    const newState = !(result.btnClicked === true); // inverse l’état

    chrome.storage.local.set({ btnClicked: newState }, () => {
      toggleDisplay(newState);
    });
  });
});

function toggleDisplay(showOpt) {
  document.getElementById("main-content").style.display = showOpt ? "none" : "block";
  document.getElementById("consent-container").style.display = "none";
  document.getElementById("activer-container").style.display = "none";
  document.getElementById("opt").style.display = showOpt ? "block" : "none";

  document.getElementById("btn-x").innerHTML ='<img src="img/optionsBefore.png" alt="Plus" width="24">';




  document.getElementById("graphContainer").style.display = "none";
  document.querySelector(".btn-x-container").style.display = "block";
}


/*************************** Toggle Graph Display *******************************/
function afficherGraphique() {
  const joursOrdre = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
  const totalParJour = {
    lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0
  };

  chrome.storage.local.get("weeklyScreenTime", (data) => {
    const weeklyData = data.weeklyScreenTime || {};

    for (const [dateStr, sites] of Object.entries(weeklyData)) {
      const date = new Date(dateStr);
      const jour = date
        .toLocaleDateString("fr-FR", { weekday: "short" })
        .toLowerCase()
        .replace(".", "");
      const totalSecondes = Object.values(sites).reduce((a, b) => a + b, 0);

      if (totalParJour.hasOwnProperty(jour)) {
        totalParJour[jour] += totalSecondes;
      }
    }

    const heuresParJour = joursOrdre.map(jour => {
      const heures = (totalParJour[jour] / 3600).toFixed(2);
      return parseFloat(heures);
    });

    const ctx = document.getElementById("screenTimeChart").getContext("2d");

    if (window.screenChartInstance) {
      window.screenChartInstance.destroy();
    }

    window.screenChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [{
          label: "Temps d'écran (heures)",
          data: heuresParJour,
          backgroundColor: "#0A66C2"
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Heures"
            }
          }
        }
      }
    });
  });
}


//enregistrer dans le graphique
function enregistrerJourActuel() {
  const todayKey = new Date().toISOString().split("T")[0];

  chrome.storage.local.get(["screenTime", "weeklyScreenTime"], (data) => {
    const screenTime = data.screenTime || {};
    const weeklyScreenTime = data.weeklyScreenTime || {};

    weeklyScreenTime[todayKey] = screenTime;

    chrome.storage.local.set({ weeklyScreenTime });
  });
}

// Appelle ça chaque soir (par exemple à 23h59)
chrome.alarms.create("saveDailyScreenTime", {
  when: Date.now() + 1000 * 10, // pour test : dans 10 secondes
  periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "saveDailyScreenTime") {
    enregistrerJourActuel();
  }
});


// Gère le clic sur le bouton "Temps écran / semaine"
document.getElementById("ts")?.addEventListener("click", () => {
  chrome.storage.local.get("tsClicked", (result) => {
    const newState = !(result.tsClicked === true); // inverse l’état

    chrome.storage.local.set({ tsClicked: newState }, () => {
      toggleGraph(newState);

      // Seulement après que le graphique soit affiché
      if (newState) afficherGraphique();
    });
  });
});
function toggleGraph(showGraph) {
  document.getElementById("graphContainer").style.display = showGraph ? "block" : "none";
  document.getElementById("moyenne").style.display = showGraph ? "block" : "none";
  document.getElementById("suspendre").style.display = showGraph ? "none" : "block";
}






/***************************Suspendre le temps/reactiver *******************************/ 

const suspendreBtn = document.getElementById("suspendre");

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



