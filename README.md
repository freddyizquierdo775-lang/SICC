# SICC — Sistema de Intercompensación Cambiaria y Compensación

> **Ecosistema SaaS de Arquitectura Cambiaria y Compensación Inter-Sucursal**  
> Plataforma que transforma centros cambiarios tradicionales en nodos de logística financiera híbrida (Digital-to-Cash), operando bajo un modelo BaaS (Banking-as-a-Service) sin licencia bancaria propia.

---

## Visión General

SICC es el **sistema nervioso de un centro cambiario físico con operación híbrida y digital**. Integra en un solo ecosistema:

- Un **anaquel de productos financieros** (compra/venta de divisas, USDT, tarjetas de puntos VIP, remesas) operados desde ventanilla física
- Una **red de nodos de liquidez interconectados** que arbitran vía cámaras de compensación, permitiendo captar efectivo en una sucursal y liquidar en otra en tiempo real
- Un **programa de referidos** con portal público, acceso biométrico y comisiones escalonadas
- Un **ERP contable** con metodología FIFO/PEPS, partida doble y trazabilidad total del capital de liquidez
- Un **marco de cumplimiento CNBV** migrado del manual de operación del sistema legado

---

## Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────┐
│                    SICC PLATFORM                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │  Web ERP      │    │  App Móvil (Próximamente)    │  │
│  │  (React+Vite) │    │  React Native / Flutter      │  │
│  │  Ventanilla   │    │  Referidores, Gerencia,      │  │
│  │  Admin/Gerente│    │  Administrativos, Contabilidad│  │
│  └──────┬───────┘    └──────────┬───────────────────┘  │
│         │                       │                      │
│         └──────────┬────────────┘                      │
│                    ▼                                    │
│         ┌──────────────────────┐                       │
│         │   API Gateway        │                       │
│         │   (Express / Node.js)│                       │
│         └──────────┬───────────┘                       │
│                    │                                    │
│    ┌───────────────┼───────────────────────┐           │
│    ▼               ▼                       ▼           │
│ ┌──────────┐ ┌────────────┐ ┌──────────────────────┐  │
│ │ SQLite/  │ │ Bridge     │ │ Web3 Gateway         │  │
│ │PostgreSQL│ │ ODBC       │ │ (Blockchain / USDT)  │  │
│ │(Core ERP)│ │→SOFTExchange││                      │  │
│ └──────────┘ │ (Compliance)│ └──────────────────────┘  │
│              └────────────┘                            │
│                                                        │
│  SOFTExchange (Legado VFP/MySQL 5.1)                   │
│  └── Compliance Engine: CNBV, OFAC, PEP               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Modelo de Negocio

SICC implementa un **modelo horizontal de coexistencia** con el sistema legado:

| Sistema | Rol |
|---------|-----|
| **SOFTExchange** (Legado) | Compliance Engine — reportes CNBV, listas negras OFAC/PEP, Matriz de Riesgo |
| **SICC** (SaaS) | Operative Brain — motor comercial y financiero, captura operaciones, gestiona dinero y aliados |

El bridge ODBC conecta ambos sistemas: SICC delega la validación legal a SOFTExchange mientras ejecuta toda la lógica comercial, contable y de liquidez.

---

## Anaquel de Productos

### 💱 Compra/Venta de Divisas (FX Trader)
Operación híbrida de ventanilla que trackea en tiempo real:

- **USDT → MXN/USD Físico** con spread siempre a favor de la casa
- **USD/MXN Físico** con tabulación por denominación (lo que entra y lo que sale)
- **Pagos por transferencia**: El sistema gestiona la logística completa. UX basada en *"Lo que recibimos / Lo que entregamos"*, mitigando errores contables en caja
- Tickera cada operación por denominación para supervisión de inventarios

### 💳 Tarjetas de Puntos VIP
Producto digital para clientes VIP que pueden fondear efectivo en ventanilla y recibir puntos menos comisión. Integrado al módulo BaaS.

### 🌐 Remesas (Cámara de Compensación)
Red de nodos de liquidez que comparten operaciones vía cámaras de compensación:

1. **Captación física** en Sucursal A (ej. Playa del Carmen)
2. **Liquidación física en tiempo real** en Sucursal B (ej. CDMX)
3. **Arbitraje P2P** entre nodos manteniendo trazabilidad total

### 🏢 Clientes B2B (Crédito Corporativo)
Relación comercial entre empresas con venta de divisas y liquidación diferida. Control de seguimiento de crédito, cuentas por cobrar y cobranza.

---

## Módulos del Sistema

### 1. Red de Captación — Programa de Referidos

Sistema de referidos con portal público:

```
Usuario "A" (Referidor)
  ├── Se registra en sucursal física
  ├── Recibe QR único asignado por ventanilla
  ├── Ingresa al portal público via QR
  ├── Se autentica con biometría (WebAuthn)
  └── Genera ticket para Usuario "B"
        └── Usuario "B" liquida en ventanilla
              └── Usuario "A" recibe comisión mensual
```

El portal permite al referidor:
- Visualizar tickets pendientes y liquidados
- Tracking de utilidades y comisiones acumuladas
- Comisiones escalonadas: **\$0.10 / \$0.15 / \$0.20 USD** por ticket según umbrales

### 2. FX Trader (Terminal de Ventanilla)

Punto de venta del cajero. Flujo operativo:

1. Cajero escanea QR del ticket o ingresa folio del pre-registro
2. Sistema auto-carga datos del referidor y cliente
3. Cajero completa la operación con denominaciones (recibido vs. entregado)
4. Cierre atómico:
   - Calcula **utilidad por Spread** (FIFO/PEPS)
   - Calcula **comisión del aliado** según tabulador
   - Registra **partida doble** en Accounting Journal
   - Actualiza **inventario de bóveda** por denominación
   - Bloquea ticket como **LIQUIDADO**
   - Genera CxC si aplica (comisiones por pagar)

### 3. Centro de Liquidez (Global Liquidity Hub)

Consola de mando para nivel Gerente/Super Admin:

- **Monitor de Nodos y Bóvedas**: Seleccionar sucursal y visualizar saldos físicos de caja + compensaciones de cada nodo en la red
- **Aportaciones de Efectivo**:
  - **Apertura**: Si saldo heredado < mínimo operativo, sistema obliga a dotar
  - **Emergencia**: Cajero solicita → Gerente autoriza con biometría (WebAuthn) → Sistema genera código de 9 caracteres → Cajero ingresa código → Aportación liberada
  - **Directa**: Gerente puede aportar sin solicitud previa

### 4. Analítica de Spread

Cruce de tres valores de tasa en tiempo real:

| Tasa | Fuente |
|------|--------|
| **Ventanilla (Sucursal)** | Precio de venta al público |
| **Internacional** | Mid-market rate |
| **P2P** | Tasa de liquidación entre nodos |

Visualización con gráficas históricas de spread y márgenes FIFO.

### 5. Gestión de Turnos de Caja

Control operativo de ventanilla:

- **Apertura**: Conteo físico de denominaciones, saldo declarado vs. esperado
- **Operación**: Registro de cada transacción con entrada/salida por denominación
- **Gastos**: Registro de gastos de caja con comprobante
- **Cierre**: Conteo físico final, desviaciones, autorización de gerente
- **Umbrales operativos**: Montos mínimos/máximos por divisa en custodia. Alertas automáticas y solicitudes de retiro parcial cuando se exceden

### 6. Clientes KYC y Cumplimiento CNBV

- Gestión de perfiles: clientes regulares, VIP, aliados B2B
- Documentos KYC con niveles de verificación
- Alertas de auditoría
- Integración con listas OFAC/PEP vía SOFTExchange
- Expedientes regulatorios para oficialía de cumplimiento

### 7. Contabilidad (Partida Doble)

- Catálogo de cuentas: Caja, Bancos, Inventario, CxC, Ingresos, Egresos
- Asientos contables automáticos por cada operación
- Metodología FIFO (PEPS) para costo de inventario de divisas
- Trazabilidad: cada operación → asiento contable → impacto en liquidez

### 8. Portal Público de Aliados (Web)

- Acceso vía QR + biometría (WebAuthn)
- Pre-registro de tickets para referidos
- Dashboard de utilidades y comisiones
- Perfil Mayorista: corte de comercio, recolección de valores (Vault-as-a-Service)

### 9. Configuración del Sistema

- **Capital Humano**: Pre-contratación, asignación de roles y permisos
- **Tasas de Cambio**: Configuración de tasas por sucursal
- **Sucursales**: Alta, configuración y gestión de nodos
- **Umbrales Operativos**: 
  - Montos mínimos/máximos de divisa en custodia por cajero
  - Alertas automáticas
  - Mecanismo de retiros parciales para mejora de seguridad operativa

---

## Seguridad y Reglas Contables

| Aspecto | Implementación |
|---------|---------------|
| Precisión numérica | `numeric(18,8)` para evitar errores de redondeo |
| Concurrencia | Bloqueo pesimista (`FOR UPDATE`) en transacciones |
| Contabilidad | Registro automático en libro diario (Partida Doble) |
| KYC | Obligatorio en umbrales \$1K / \$3K / \$5K USD |
| Autorizaciones | WebAuthn (huella/FaceID) para operaciones críticas |
| Cumplimiento | Candados de SOFTExchange para identificación obligatoria |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend Web** | React 19 + TypeScript + Vite + Tailwind CSS |
| **App Móvil** | React Native / Flutter (Próximamente) |
| **Backend** | Express + tsx (TypeScript Server) |
| **Base de Datos** | SQLite (desarrollo) → PostgreSQL/Supabase (producción) |
| **Blockchain** | Web3 Gateway para USDT / Smart Contracts |
| **Gráficos** | Recharts |
| **PDF** | jsPDF |
| **Animaciones** | Motion (Framer Motion) |
| **Biometría** | WebAuthn API |

---

## Estado del Proyecto

### ✅ Funcional (MVP actual)
- [x] FX Trader (Compra/Venta con spread y comisiones)
- [x] Centro de Liquidez con monitor de nodos y bóvedas
- [x] Cámara de Compensación (Clearing House)
- [x] Analítica de Spread con gráficas FIFO
- [x] Módulo de Transacciones
- [x] Clientes KYC y Cumplimiento CNBV
- [x] Programa de Aliados con portal público y QR
- [x] Turnos de Caja (apertura/cierre/conteo/desviaciones)
- [x] Contabilidad (Partida Doble automatizada)
- [x] Denominaciones e Inventario de Bóveda
- [x] Configuración de sucursales, thresholds y usuarios
- [x] Sistema de Roles (5 niveles de acceso)

### 🔄 En Desarrollo
- [ ] UX "Recibimos / Entregamos" en ventanilla
- [ ] Dotaciones: flujo completo emergencia + apertura con código 9 chars
- [ ] Umbrales operativos con motor de alertas automáticas
- [ ] Clientes B2B con crédito y control de cobranza
- [ ] Tarjetas de Puntos VIP

### 📱 Próximos
- [ ] App Móvil (React Native / Flutter)
- [ ] Bridge ODBC real con SOFTExchange
- [ ] Sincronización en tiempo real (WebSockets) entre nodos

---

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
http://localhost:3000
```

---

## Repositorio

**GitHub:** [freddyizquierdo775-lang/SICC](https://github.com/freddyizquierdo775-lang/SICC)
