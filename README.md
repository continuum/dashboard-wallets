# Visualizador de Encuestas: Estudio Billeteras Digitales 2026 - Continuum

Este repositorio contiene la aplicación web interactiva y consolidada para visualizar, analizar y contrastar los resultados preliminares del **Estudio de Billeteras Digitales 2026** llevado a cabo por **Continuum**. El sistema centraliza y procesa en tiempo real las respuestas provenientes de tres encuestas aplicadas a distintas audiencias (Continuum, Chócale y ChilePay) a través de Google Sheets.

El dashboard está publicado y disponible en producción en:
👉 [https://continuum.github.io/dashboard-wallets/](https://continuum.github.io/dashboard-wallets/)

---

## 🚀 Características Clave

* **Consolidación Híbrida**: Permite ver tanto los resultados agregados (Consolidado de las 3 encuestas) como el desglose individual filtrado para cada marca.
* **Mapa de Oportunidades JTBD**: Matriz interactiva de dispersión (Scatter Plot) de *Importancia vs Dificultad* para evaluar las 10 metas financieras principales (Jobs to be Done) de los chilenos, indicando los cuadrantes de prioridad y básicos.
* **Ranking de Prioridad de Jobs**: Listado automático de oportunidades ordenado de mayor a menor dolor observado, con tooltips emergentes que describen detalladamente cada Job al posicionar el cursor sobre ellos.
* **Perfil Consolidado de la Muestra**: Tarjetas de distribución demográfica uniformes (Billeteras Preferidas, Género, Situación Laboral y Gestión de Finanzas) limitadas de manera consistente al *Top 5* de respuestas para una estética visual simétrica.
* **Estilo Visual Premium (B2B)**: Interfaz de usuario responsiva diseñada bajo directrices de minimalismo ejecutivo. Soporta modo de color Claro, Oscuro y de Sistema con logotipos adaptados automáticamente.
* **Acceso Protegido**: El panel de ajustes de Google Sheets y la opción de restablecer la base de datos están protegidos bajo contraseña cliente (`continuum_billeteras_2026`) para evitar modificaciones accidentales.
* **Navegación Interactiva**: Las tarjetas métricas en el resumen ejecutivo actúan como botones interactivos con efectos de elevación (*hover lift*), redirigiendo al analista a la pestaña de desglose con el filtro correspondiente pre-seleccionado.

---

## 🛠️ Arquitectura de Desarrollo

La aplicación está diseñada bajo el patrón de **Single Page Application (SPA)** serverless, lo que le permite funcionar en servidores de contenido estático (como GitHub Pages) consumiendo APIs públicas sin intermediarios de base de datos.

```mermaid
graph TD
    A[Navegador del Cliente] -->|1. Carga SPA estática| B(GitHub Pages / Dist)
    A -->|2. Obtiene datos en vivo sin CORS| C(Google Sheets API v4 /gviz/tq)
    A -->|3. Almacena temporalmente en caché| D(LocalStorage del Navegador)
    
    subgraph Arquitectura React (src)
        App[App.jsx: Estado Global, Rutas y Temas]
        App --> Config[config.js: Enlaces oficiales y Clave]
        App --> Fetcher[sheetFetcher.js: Consumo REST y Limpieza]
        App --> Aggregator[dataAggregator.js: Lógica JTBD, Likert y Demografías]
        App --> Dashboard[Dashboard.jsx: Componente de Vistas]
        Dashboard --> Recharts[Recharts: Scatter y Bar Charts]
        Dashboard --> Styles[index.css: Diseño y Fichas de Marca]
    end
```

### 1. Stack Tecnológico
* **Frontend**: React 19 y Vite como entorno de compilación ultra rápido.
* **Visualización de Gráficos**: [Recharts](https://recharts.org/) (gráficos de barras apiladas y mapa de dispersión SVG interactivo).
* **Iconografía**: [Lucide React](https://lucide.dev/).
* **Estilado**: CSS Vanilla puro (`index.css`) estructurado con variables y tokens de diseño para máxima velocidad de carga, flexibilidad y control total del comportamiento Dark/Light.

### 2. Flujo de Datos y Agregación
La sincronización y modelado de datos se realiza en el cliente en dos fases asíncronas para garantizar que la app permanezca offline-friendly e interactiva:

* **Soporte de Columnas Colisionadas (`sheetFetcher.js`)**: Las respuestas se obtienen a través del endpoint de visualización de Google (`/gviz/tq`). Dado que los Sheets de encuestas contienen múltiples columnas con textos idénticos (ej. *"¿Cuán importante es esto para ti?"* repetido 10 veces), el parser les inyecta sufijos secuenciales (`__dup__N`) en memoria para evitar la colisión y sobreescritura de claves en el JSON de respuesta.
* **Mapeo por Orden Relativo Sequencial (`dataAggregator.js`)**: Para evitar fallos si los textos de las preguntas varían levemente en el futuro, el agregador ignora el string del encabezado y mapea las columnas secuenciales (de la 6 a la 25 en la encuesta) directamente a los 10 Jobs oficiales de Continuum según su posición relativa.
* **Parseo y Homogeneización Likert**: Extrae el valor numérico inicial (ej. de `"5 (Muy importante)"` extrae `5`). Si detecta una escala base 5, la escala automáticamente al multiplicar por 2 para homogeneizarla y poder contrastarla con el Estudio 2025 en base 10.
* **Persistencia Local (Caché)**: Las respuestas parseadas y estructuradas se guardan en el `localStorage` con un sello de tiempo. Si los datos tienen menos de 30 minutos de antigüedad (configurable en ajustes), se cargan instantáneamente desde la caché del navegador para omitir llamadas de red lentas.

---

## 💻 Desarrollo Local

Para correr, compilar o desplegar modificaciones en la aplicación localmente, asegúrate de tener instalado [Node.js](https://nodejs.org/) en tu máquina y ejecuta los siguientes comandos en tu terminal:

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   *Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver los cambios en vivo.*

3. **Compilar para producción**:
   ```bash
   npm run build
   ```
   *Genera los archivos estáticos listos para producción en la carpeta `dist/`.*

4. **Desplegar en GitHub Pages**:
   ```bash
   npm run deploy
   ```
   *Compila el proyecto automáticamente y sube el contenido de `dist/` a la rama `gh-pages` del repositorio remoto.*

---

## 📊 Formato de Google Sheets

Para que la aplicación lea correctamente los datos, las hojas de cálculo deben cumplir con los siguientes requisitos:

1. **Compartido**: Cada Google Sheet debe estar compartido públicamente como **"Cualquier persona con el enlace puede ver" (Lector)**.
2. **Estructura de Columnas**: Las hojas de cálculo deben tener las respuestas de los 10 Jobs to be Done en las columnas secuenciales en el orden correspondiente (Universalidad, Seguridad, Control, Retribución, Trazabilidad, Rentabilidad del saldo, Gestión de presupuesto, Acceso para terceros, Servicios cotidianos y Diversidad de pagos), intercalando una pregunta de Importancia y otra de Dificultad para cada Job.
3. **Estructura Demográfica**: El agregador detectará de forma inteligente las columnas demográficas mediante búsquedas de palabras clave en minúscula (ej. "género", "ocupación", "finanzas", "billeteras", etc.).

---

Developed with ❤️ for **Continuum** &copy; 2026.
