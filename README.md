
# 📩 Cajasan AI-CORE: Intelligent Email Management System

Este proyecto es una solución integral para el procesamiento masivo de comunicaciones institucionales de **Cajasan**. Utiliza Inteligencia Artificial Generativa para transformar una bandeja de entrada saturada en un panel de control operativo de alta eficiencia.

![Texto alternativo](https://cajasan.com/images/plantilla/16-9.webp)

### El reto
El personal administrativo de Cajasan se enfrenta a volúmenes superiores a los 8,000 correos electrónicos, lo que requiere aproximadamente 4 horas de revisión manual. **AI-CORE** reduce este tiempo a menos de una hora, clasificando, resumiendo y priorizando cada mensaje automáticamente.

## 🛠️ Stack Tecnológico
* **IA Engine:** Google Gemini 2.5 Flash (API)
* **Backend:** Node.js
* **Frontend:** React + Tailwind CSS 4.0
* **Arquitectura:** Monorepo

## 💡 Funcionalidades
* Procesamiento por lotes
* Clasificación por categoría, prioridad y sentimiento
* Acción recomendada automática
* Dashboard con KPIs

## 📂 Estructura
```text
cajasan-ai-solution/
├── .gitignore                # Reglas para no subir basura ni llaves privadas
├── README.md                 # Documentación profesional que redactamos
│
├── cajasan-ai-inbox/             # MOTOR DE INTELIGENCIA ARTIFICIAL (Node.js)
│   ├── node_modules/         # Dependencias del backend
│   ├── .env                  # Tu API KEY de Gemini (No se sube a GitHub)
│   ├── data.json             # Dataset de entrada (400 correos)
│   ├── generateData.js       # Script para crear los datos de prueba
│   ├── processor.js          # El "Cerebro": script de procesamiento masivo
│   ├── package.json          # Scripts y dependencias (google-generative-ai, dotenv)
│   └── resultado_final_cajasan.json  # El archivo final procesado por la IA
│
└── cajasan-frontend/             # INTERFAZ DE USUARIO (React + Tailwind 4.0)
    ├── node_modules/         # Dependencias del frontend
    ├── public/
    │   └── logo-cajasan.png  # Logo para la pestaña del navegador
    ├── src/
    │   ├── assets/
    │   │   └── logo-cajasan.png # Logo que usamos en el Nav
    │   ├── data/
    │   │   └── resultado_final_cajasan.json # Copia de los resultados del motor
    │   ├── App.jsx           # Dashboard principal con filtros y buscador
    │   ├── index.css         # Configuración de Tailwind 4.0 y variables de marca
    │   └── main.jsx          # Punto de entrada de React
    ├── index.html            # Estructura base HTML
    ├── package.json          # Scripts de Vite y dependencias
    └── vite.config.js        # Configuración del plugin de Tailwind 4.0
```

## ⚙️ Instalación
```bash
cd cajasan-ai-inbox
npm install
node generateData.js
node processor.js
```

```bash
cd cajasan-frontend
npm install
npm run dev
```

## 🧠 Prompt Engineering
System prompt como coordinador senior + salida JSON estricta.

## 👤 Autor
Mateo Roman - Desarrollador de Software - [Acerca de mí](https://github.com/Mvteiio) 

---
## .gitignore

```text
node_modules/
.env
dist/
resultado_final_cajasan.json
.vscode/
```
