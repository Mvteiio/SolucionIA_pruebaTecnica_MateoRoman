# Cajasan AI Inbox (Uso Interno)

Solucion monorepo para procesar correos de Outlook con Azure OpenAI y visualizarlos en un dashboard React.

## Stack actual
- Backend: Node.js (Microsoft Graph + Azure OpenAI)
- Frontend: React + Vite + Tailwind CSS 4
- Arquitectura: monorepo (`cajasan-ai-inbox` + `cajasan-frontend`)

## Estructura
```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── cajasan-ai-inbox/
│   ├── src/
│   │   ├── app/            # Orquestación del flujo
│   │   ├── config/         # Carga y validación de entorno
│   │   ├── domain/         # Reglas de negocio y contrato de datos
│   │   ├── services/       # Integraciones externas (Graph, OpenAI)
│   │   ├── storage/        # Persistencia local
│   │   └── utils/          # Utilidades compartidas
│   ├── tests/              # Pruebas unitarias (node:test)
│   ├── auth.js             # Wrapper legacy
│   ├── outlookService.js   # Wrapper legacy
│   ├── processor.js        # Entry point
│   ├── resultado_final_cajasan.json
│   ├── .env.example
│   └── package.json
├── cajasan-frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Backend (`cajasan-ai-inbox`)

### 1) Configuracion
Crear `.env` tomando como base `.env.example`:

```bash
cd cajasan-ai-inbox
cp .env.example .env
```

Variables requeridas:
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_VERSION`

### 2) Ejecucion
```bash
cd cajasan-ai-inbox
npm install
npm start
```

Notas:
- El backend usa autenticacion interactiva de Azure (`InteractiveBrowserCredential`), por lo que abre login en navegador.
- El resultado se guarda en `cajasan-ai-inbox/resultado_final_cajasan.json`.
- El procesamiento usa lotes y reintentos automáticos para errores transitorios (incluyendo 429).

### Scripts
```bash
npm start
npm test
npm run verify
```

`test` ejecuta pruebas unitarias con `node:test`.  
`verify` revisa sintaxis de entrypoint y módulos backend.

## Frontend (`cajasan-frontend`)
```bash
cd cajasan-frontend
npm install
npm run dev
```

Build de produccion:
```bash
npm run build
```

## Notas operativas
- El frontend consume directamente el JSON generado por backend:
  - `cajasan-frontend/src/App.jsx` importa `../../cajasan-ai-inbox/resultado_final_cajasan.json`.
- El `.gitignore` excluye `.env` y artefactos de build.

## Comandos de workspace (raíz)
```bash
npm run test
npm run verify
npm run lint
npm run build
npm run check
```

Nota: actualización menor para re-disparar CI.
