# Scrape2MD

**Convierta páginas web dinámicas en Markdown limpio y listo para LLM.**

[Read in English](README.md) | [Lire en Français](README.fr.md) | [简体中文](README.zh-CN.md)

---

**Scrape2MD** es un microservicio de alto rendimiento e interfaz web diseñado para cerrar la brecha entre la web visual y los Modelos de Lenguaje Grande (LLMs). Ingiere sitios web complejos y cargados de JavaScript, elimina el ruido (anuncios, navegación, scripts) y entrega contenido Markdown puro y estructurado, ideal para RAG (Generación Aumentada por Recuperación), resúmenes y análisis.

## ✨ Características Clave

*   **Soporte de Contenido Dinámico:** Impulsado por **Playwright**, renderiza y extrae con éxito Aplicaciones de Página Única (SPAs) y sitios pesados en JavaScript que los scrapers tradicionales pierden.
*   **Limpieza Inteligente:** Utiliza **BeautifulSoup** y heurísticas inteligentes para eliminar desorden como anuncios, ventanas emergentes y menús de navegación, preservando solo el contenido central.
*   **Salida Optimizada para LLM:** Convierte HTML a Markdown semántico y limpio (encabezados, listas, enlaces) listo para el procesamiento de IA.
*   **Interfaz Dual:** Ofrece tanto una **API REST** robusta para desarrolladores como una **Web UI** moderna en React para uso manual.
*   **Extracción de Metadatos:** Captura automáticamente títulos de página, recuentos de tokens originales/limpios y métricas de optimización.
*   **Listo para Contenedores:** Totalmente contenerizado con Docker para un despliegue fácil.

## 🛠️ Stack Tecnológico

### Backend (API)
*   **Python 3.10+**
*   **FastAPI:** Framework web de alto rendimiento para construir APIs.
*   **Playwright:** Automatización de navegador headless para renderizado confiable.
*   **BeautifulSoup4:** Análisis y limpieza de HTML.
*   **Markdownify:** Conversión de HTML a Markdown.

### Frontend (Web UI)
*   **React 18** con **TypeScript**
*   **Vite:** Herramientas de frontend de próxima generación.
*   **Tailwind CSS:** Framework CSS "utility-first" para estilos.
*   **Lucide React:** Iconos hermosos y consistentes.

## 🚀 Primeros Pasos

### Prerrequisitos
*   **Python 3.10** o superior
*   **Node.js 18** o superior
*   **Git**

### 1. Configuración del Backend (API)

Navegue al directorio del backend:
```bash
cd scrape2md
```

Cree y active un entorno virtual:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Instale las dependencias y los binarios del navegador:
```bash
pip install -r requirements.txt
playwright install chromium
```

Inicie el servidor API:
```bash
python -m uvicorn app.main:app --reload
```
*La API estará disponible en `http://localhost:8000`*

### 2. Configuración del Frontend (Web UI)

Abra una nueva terminal y navegue al directorio del frontend:
```bash
cd scrape2md_website
```

Instale las dependencias de Node:
```bash
npm install
```

Inicie el servidor de desarrollo:
```bash
npm run dev
```
*La Web UI estará disponible en `http://localhost:3000`*

## 📖 Uso

### Interfaz Web
1.  Abra `http://localhost:3000` en su navegador.
2.  Pegue la URL que desea convertir en el campo de entrada.
3.  (Opcional) Haga clic en **Config** para establecer un selector CSS específico para esperar (útil para sitios de carga lenta) o para alternar la inclusión de imágenes.
4.  Haga clic en **Execute**.
5.  Vea el resultado en la pestaña "Preview" o copie el código sin procesar desde la pestaña "Code".

### Uso de la API
Puede invocar el servicio de scraping directamente mediante `curl` o cualquier cliente HTTP.

**Endpoint:** `POST /scrape`

**Petición:**
```bash
curl -X POST http://127.0.0.1:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "wait_for_selector": "body",
    "include_images": false
  }'
```

**Respuesta:**
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