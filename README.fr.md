# Scrape2MD

**Convertissez des pages web dynamiques en Markdown propre et prêt pour les LLM.**

[Read in English](README.md) | [Leer en Español](README.es.md) | [简体中文](README.zh-CN.md)

---

**Scrape2MD** est un microservice haute performance et une interface web conçus pour combler le fossé entre le web visuel et les Grands Modèles de Langage (LLMs). Il ingère des sites web complexes et lourds en JavaScript, élimine le bruit (publicités, navigation, scripts) et fournit un contenu Markdown pur et structuré, idéal pour le RAG (Génération Augmentée par la Récupération), le résumé et l'analyse.

## ✨ Fonctionnalités Clés

*   **Support du Contenu Dynamique :** Propulsé par **Playwright**, il rend et scrape avec succès les Applications à Page Unique (SPAs) et les sites lourds en JavaScript que les scrapers traditionnels manquent.
*   **Nettoyage Intelligent :** Utilise **BeautifulSoup** et des heuristiques intelligentes pour supprimer les encombrements tels que les publicités, les popups et les menus de navigation, ne préservant que le contenu principal.
*   **Sortie Optimisée pour LLM :** Convertit le HTML en Markdown propre et sémantique (titres, listes, liens) prêt pour le traitement par IA.
*   **Double Interface :** Offre à la fois une **API REST** robuste pour les développeurs et une **Web UI** moderne en React pour une utilisation manuelle.
*   **Extraction de Métadonnées :** Capture automatiquement les titres de page, le nombre de jetons originaux/nettoyés et les métriques d'optimisation.
*   **Prêt pour Conteneur :** Entièrement conteneurisé avec Docker pour un déploiement facile.

## 🛠️ Stack Technique

### Backend (API)
*   **Python 3.10+**
*   **FastAPI :** Framework web haute performance pour créer des API.
*   **Playwright :** Automatisation de navigateur headless pour un rendu fiable.
*   **BeautifulSoup4 :** Analyse et nettoyage HTML.
*   **Markdownify :** Conversion HTML vers Markdown.

### Frontend (Web UI)
*   **React 18** avec **TypeScript**
*   **Vite :** Outils frontend de nouvelle génération.
*   **Tailwind CSS :** Framework CSS "utility-first" pour le stylisme.
*   **Lucide React :** Icônes belles et cohérentes.

## 🚀 Pour Commencer

### Prérequis
*   **Python 3.10** ou supérieur
*   **Node.js 18** ou supérieur
*   **Git**

### 1. Configuration du Backend (API)

Naviguez vers le répertoire backend :
```bash
cd scrape2md
```

Créez et activez un environnement virtuel :
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Installez les dépendances et les binaires du navigateur :
```bash
pip install -r requirements.txt
playwright install chromium
```

Démarrez le serveur API :
```bash
python -m uvicorn app.main:app --reload
```
*L'API sera disponible sur `http://localhost:8000`*

### 2. Configuration du Frontend (Web UI)

Ouvrez un nouveau terminal et naviguez vers le répertoire frontend :
```bash
cd scrape2md_website
```

Installez les dépendances Node :
```bash
npm install
```

Démarrez le serveur de développement :
```bash
npm run dev
```
*La Web UI sera disponible sur `http://localhost:3000`*

## 📖 Utilisation

### Interface Web
1.  Ouvrez `http://localhost:3000` dans votre navigateur.
2.  Collez l'URL que vous souhaitez convertir dans le champ de saisie.
3.  (Optionnel) Cliquez sur **Config** pour définir un sélecteur CSS spécifique à attendre (utile pour les sites lents) ou pour inclure les images.
4.  Cliquez sur **Execute**.
5.  Visualisez le résultat dans l'onglet "Preview" ou copiez le code brut depuis l'onglet "Code".

### Utilisation de l'API
Vous pouvez invoquer le service de scraping directement via `curl` ou tout client HTTP.

**Endpoint :** `POST /scrape`

**Requête :**
```bash
curl -X POST http://127.0.0.1:8000/scrape \
  -H "Content-Type: application/json" \
  -d 
  {
    "url": "https://example.com",
    "wait_for_selector": "body",
    "include_images": false
  }
```

**Réponse :**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "markdown_content": "# Example Domain\n\nThis domain is for use in illustrative examples...",
  "metadata": {
    "original_length": 1200,
    "cleaned_length": 450
  }
}
```