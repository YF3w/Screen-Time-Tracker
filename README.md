# Screen-Time-Tracker

# 📊 Extension Chrome - Suivi du Temps d'Écran

Cette extension Chrome permet de suivre et d'afficher le temps passé sur les sites web, avec une interface simple et des options comme l'affichage d'un graphique hebdomadaire, la suspension du suivi, et la gestion du consentement utilisateur.

## 🚀 Fonctionnalités principales

- ⏱ Affichage en temps réel du temps passé sur chaque site
- 📈 Graphique hebdomadaire du temps d'écran par jour
- ✅ Système de consentement (RGPD friendly)
- 🔒 Option pour suspendre ou réactiver le suivi
- ➕ Interface simplifiée avec options masquables


## 🛠 Installation et utilisation

1. Ouvre Chrome et va à `chrome://extensions/`.
2. Active **Mode développeur** (coin supérieur droit).
3. Clique sur **"Charger l’extension non empaquetée"**.
4. Sélectionne le dossier contenant les fichiers de ton projet.
5. Clique sur l’icône de l’extension dans la barre d’outils pour voir le suivi en temps réel.

## 📦 Fonctionnement technique

- `background.js` : enregistre le temps passé sur chaque site.
- `popup.js` :
  - Affiche le temps dans le popup.
  - Gère le consentement et l'affichage des composants.
  - Génère un graphique hebdomadaire à partir des données sauvegardées.
- `popup.html` : structure de l'interface utilisateur.
- `popup.css` : styles de l'interface.

## 📊 Technologies utilisées

- HTML, CSS, JavaScript
- API Chrome Extensions (storage, alarms, etc.)
- Chart.js (pour les graphiques)

## 📝 À venir (idées d’amélioration)

- Export des données en CSV
- Paramètres de seuil d’alerte
- Notifications personnalisées


Développé avec ❤️ 

