# Political Trends 📊

Application d'analyse et de visualisation des tendances politiques en France.

## Table of Contents

- [🎯 Objectif](#-objectif)
- [📈 Fonctionnalités principales](#-fonctionnalités-principales)
  - [Graphiques interactifs avec filtres avancés](#graphiques-interactifs-avec-filtres-avancés)
  - [Visualisations disponibles](#visualisations-disponibles)
  - [Analyses comparatives](#analyses-comparatives)
- [📊 Sources de données](#-sources-de-données)
  - [Résultats électoraux](#résultats-électoraux)
  - [Sondages](#sondages)
  - [Types d'élections couverts](#types-délections-couverts)
- [📦 Structure](#-structure)
- [API Installation](#api-installation)
- [APP Installation](#app-installation)
- [Admin Installation](#admin-installation)

---

## 🎯 Objectif

Cette application permet d'analyser et de visualiser les résultats des élections françaises ainsi que les sondages d'opinion, afin de comprendre les évolutions politiques au fil du temps.

## 📈 Fonctionnalités principales

### Graphiques interactifs avec filtres avancés

L'application propose des graphiques dynamiques avec les filtres suivants :

- **Élections** : Sélectionner un ou plusieurs types d'élections (municipales, européennes, présidentielles, législatives, régionales, métropolitaines)
- **Temporalité** : Définir une période (depuis 2015, entre 2019 et 2023, etc.)
- **Parti politique** : Afficher uniquement certains partis (LFI, RN, PS, LR, etc.)
- **Nuance politique** : Regrouper les partis par tendance :
  - Gauche : PS, EELV, PCF, LFI
  - Droite : DVD, LR
  - Extreme droite : RN, RECONQUETE
  - etc.
- **Candidats** : Filtrer sur des candidats spécifiques
- **Lieu** :
  - France entière (résultats globaux, circonscriptions pour les législatives)
  - Par ville

### Visualisations disponibles

Les graphiques permettent d'afficher le **pourcentage** de chaque :

- Parti politique
- Nuance politique
- Candidat

selon les filtres définis.

### Analyses comparatives

- **Par élection** : Comparer les sondages et les résultats finaux pour chaque élection
- **Entre élections** : Analyser l'évolution entre différentes élections
- **Par territoire** : Observer comment une ville évolue politiquement dans le temps
- **Sondages vs Résultats** : Toujours en comparant les prédictions avec les résultats officiels

## 📊 Sources de données

### Résultats électoraux

- **data.gouv.fr** : Données officielles des résultats électoraux
  - Résultats agrégés de toutes les élections : https://www.data.gouv.fr/datasets/donnees-des-elections-agregees
  - Résultats pour chaque élection (national, communal, etc.) : https://www.data.gouv.fr/pages/donnees-des-elections-et-referendums
- **Scraping** : Sites officiels et sources complémentaires

### Sondages

- **Commission des sondages** : Données officielles
- **Wikipedia** : Répertoire des sondages historiques

### Types d'élections couverts

- Présidentielles
- Législatives
- Municipales
- Européennes
- Régionales
- Métropolitaines

---

## 📦 Structure

Le projet est composé de 3 applications :

- **api/** - Backend Node.js/Express avec MongoDB
- **app/** - Frontend React (application utilisateur)
- **admin/** - Frontend React (panel d'administration)

---

## API Installation

1. Install dependencies

   ```bash
   cd api
   npm install
   ```

2. Create your database on Clever Cloud

   - Create a MongoDB add-on
   - Retrieve the MongoDB connection URI from the add-on information

3. Create `.env` file in `/api`:

   ```env
   MONGO_URI=your-mongodb-uri
   SECRET=your-jwt-secret
   APP_URL=http://localhost:3000
   ADMIN_URL=http://localhost:3001
   ENVIRONMENT=development
   ```

   Default ports:

   - API: `8080`
   - App: `3000`
   - Admin: `3001`

4. Configure Sentry (optional)

   In `api/src/config.js`, add your Sentry DSN.

5. Start the server

   ```bash
   npm run dev
   ```

---

## APP Installation

1. Install dependencies

   ```bash
   cd app
   npm install
   ```

2. Configure Sentry (optional)

   In `app/src/config.js`, add your Sentry DSN:

   ```javascript
   const SENTRY_URL = "YOUR_SENTRY_URL";
   ```

3. Start the server

   ```bash
   npm run dev
   ```

---

## Admin Installation

1. Install dependencies

   ```bash
   cd admin
   npm install
   ```

2. Configure Sentry (optional)

   In `admin/src/config.js`, add your Sentry DSN.

3. Start the server

   ```bash
   npm run dev
   ```
