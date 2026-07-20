# Bancore Platform

Plataforma avanzada de intercambio y finanzas con módulo **BaaS (Banking-as-a-Service)** para gestión de clientes VIP, billeteras digitales y tarjetas Mastercard.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Express + TypeScript (tsx) |
| **BD** | SQLite (better-sqlite3) + esquema PostgreSQL disponible |
| **AI** | Google Gemini API |
| **Gráficos** | Recharts |
| **PDFs** | jsPDF |
| **Animaciones** | Motion (Framer Motion) |
| **Uploads** | Multer |

## Módulos

- **Módulo 1** — Mobile API para operaciones cambiarias
- **Módulo 2** — Cámara de Compensación (Clearing House)
- **Módulo 3** — Backoffice y administración
- **Módulo BaaS** — Banking-as-a-Service: clientes VIP, wallets, tarjetas
- **ERP Contable** — Partida doble, inventario FIFO, comisionistas
- **Cumplimiento** — KYC/AML, perfiles de riesgo
- **Caja** — Apertura/cierre de turnos, cortes, control de efectivo

## Requisitos

- Node.js 18+
- npm

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/bancore-platform.git
cd bancore-platform

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY

# 4. Iniciar servidor de desarrollo
npm run dev
```

El servidor arranca en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | API key de Google Gemini AI |
| `APP_URL` | URL pública de la aplicación |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila frontend para producción |
| `npm run preview` | Previsualiza build de producción |
| `npm run lint` | Verifica tipos con TypeScript |

## API Endpoints

### Salud
```
GET /api/health → { status: "ok", service: "BaaS API Gateway" }
```

### Cámara de Compensación (Clearing House)
```
POST /api/clearing-house/captacion    — Registro de captación (on-ramp)
POST /api/clearing-house/liquidacion  — Liquidación (off-ramp)
```

### Tasas de cambio
```
GET /api/rates/live → Tasas en tiempo real (simuladas)
```

### Sistema Legado (SOFTExchange)
```
GET /api/legacy/balances → Balances simulados de sistema legacy
```

## Licencia

MIT
