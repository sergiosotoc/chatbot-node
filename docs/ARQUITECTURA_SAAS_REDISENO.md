# Rediseño de Arquitectura SaaS - Chatbot WhatsApp

## Análisis del Estado Actual

### Problemas críticos detectados

1. **Violación multi-tenant**: Varios endpoints devuelven datos de TODAS las empresas sin filtrar por `empresa_id`:
   - `chats.controller.getConversaciones` → devuelve todos los clientes
   - `chats.controller.getConversacion` → sin validar que el cliente pertenezca a la empresa
   - `pedidos.controller.getPedidos` → devuelve todos los pedidos
   - `clientes.controller.getClientes` → devuelve todos los clientes

2. **getEmpresa incorrecto**: Devuelve `.limit(1).single()` (la primera empresa) en lugar de la empresa del usuario autenticado.

3. **Webhook sin empresa**: Al crear `clientes_whatsapp` en el webhook, nunca se asigna `empresa_id`.

4. **WhatsApp API única**: Un solo `WHATSAPP_PHONE_ID` y `WHATSAPP_TOKEN` para todo el sistema. Para multi-empresa necesitas routing por número o una API por empresa.

5. **Inconsistencia de roles**: La tabla `operadores` usa default `agente`, pero el auth usa `admin`, `empresa`, `usuario`.

---

## Propuesta de Módulos por Rol

### 1. ADMINISTRADOR (rol: `admin`)

**Responsabilidad**: Control total del SaaS. Gestiona APIs, empresas, configuración global.

| Módulo | Funcionalidad |
|--------|---------------|
| Dashboard | KPIs globales (empresas activas, pedidos totales, conversaciones) |
| Empresas | CRUD empresas, activar/desactivar, ver métricas por empresa |
| Usuarios Admin | Crear operadores con rol admin (opcional) |
| Operadores | Ver todos los operadores del sistema, filtrar por empresa |
| Tarifas | Tarifas globales del cotizador (o por empresa si quieres diferenciar) |
| Configuración WhatsApp | Por cada empresa: phone_id, token (gestión de APIs) |
| Logs | Auditoría de actividad del sistema |
| Suscripciones/Planes | (Futuro) Control de planes por empresa |

### 2. EMPRESA / DUEÑO (rol: `empresa`)

**Responsabilidad**: Gestionar su negocio. Ve solo sus datos. Gestiona empleados.

| Módulo | Funcionalidad |
|--------|---------------|
| Dashboard | Pedidos del día, conversaciones activas, resumen de su empresa |
| Pedidos | Ver pedidos de sus clientes, enviar guías |
| Mensajes | Conversaciones WhatsApp con compradores (solo sus clientes) |
| Usuarios | Crear/editar empleados (rol `usuario`) de su empresa |
| Perfil | Datos bancarios, número WhatsApp, datos de contacto |

### 3. EMPLEADO / AGENTE (rol: `usuario`)

**Responsabilidad**: Atención al cliente. Ver pedidos y responder mensajes.

| Módulo | Funcionalidad |
|--------|---------------|
| Pedidos | Ver pedidos (solo lectura o con acciones limitadas) |
| Mensajes | Responder chats con compradores |
| (Opcional) Dashboard | Resumen de conversaciones asignadas |

---

## Cambios en Base de Datos

### Tabla `empresas` – campos sugeridos

```sql
-- Campos existentes están bien. Agregar para SaaS:
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_phone_id text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_token_encrypted text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plan text DEFAULT 'basico';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

**Nota**: `whatsapp_phone_id` y `whatsapp_token_encrypted` permiten que cada empresa tenga su propia API de WhatsApp. Si usas un solo número, no los necesitas.

### Tabla `operadores` – unificar roles

```sql
-- El default 'agente' en la BD no coincide con los roles usados.
-- Opciones: usar 'usuario' como default o agregar constraint
ALTER TABLE operadores DROP CONSTRAINT IF EXISTS operadores_rol_check;
ALTER TABLE operadores ADD CONSTRAINT operadores_rol_check 
  CHECK (rol IN ('admin', 'empresa', 'usuario'));
-- Actualizar registros con rol 'agente' a 'usuario'
UPDATE operadores SET rol = 'usuario' WHERE rol = 'agente';
```

### Tabla `pedidos` – empresa explícita (opcional pero recomendado)

Los pedidos ya tienen `cliente_id` → `clientes_whatsapp.empresa_id`. Para filtros más eficientes:

```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);

-- Migrar datos existentes
UPDATE pedidos p
SET empresa_id = cw.empresa_id
FROM clientes_whatsapp cw
WHERE p.cliente_id = cw.id;
```

### Vista `v_pedidos` – incluir empresa_id

```sql
CREATE OR REPLACE VIEW public.v_pedidos AS
SELECT
  p.id,
  p.folio,
  p.servicio,
  p.precio,
  p.estatus,
  p.guia_url,
  p.datos_envio,
  p.created_at,
  COALESCE(p.cliente_whatsapp, cw.telefono) AS telefono_cliente,
  cw.nombre AS nombre_cliente,
  cw.id AS cliente_id,
  cw.empresa_id  -- ← AGREGAR para filtrado
FROM pedidos p
LEFT JOIN clientes_whatsapp cw ON p.cliente_id = cw.id;
```

### Webhook – asociar cliente a empresa

El webhook de Meta incluye `phone_number_id` en el payload. Debes mapear ese ID a una empresa:

```sql
-- Ya tienes telefono_whatsapp en empresas.
-- Si cada empresa tiene un número distinto, puedes mapear por ese número.
-- O usa whatsapp_phone_id si lo agregas.
```

---

## Arquitectura de Rutas y Middleware

### Flujo de autenticación

```
login → JWT { id, username, role, empresa_id }
         ↓
    redirectByRole(role)
         admin  → /admin/dashboard
         empresa → /empresas/dashboard
         usuario → /empresas/dashboard (mismo panel, permisos restringidos)
```

### Middleware de scoping por empresa

```javascript
// Nuevo: asegurar que req.user.empresa_id existe para roles empresa/usuario
function requireEmpresaScope(req, res, next) {
  if (req.user?.role === 'admin') return next();
  if (!req.user?.empresa_id) {
    return res.status(403).json({ error: 'Usuario sin empresa asociada' });
  }
  next();
}

// Para endpoints de empresa: filtrar por req.user.empresa_id
```

### Resumen de rutas por módulo

| Ruta | Admin | Empresa | Usuario |
|------|-------|---------|---------|
| GET /admin/dashboard | ✓ | ✗ | ✗ |
| GET /admin/empresas | ✓ | ✗ | ✗ |
| POST /admin/empresas | ✓ | ✗ | ✗ |
| PUT /admin/empresas/:id | ✓ | ✗ | ✗ |
| GET /admin/operadores | ✓ | ✗ | ✗ |
| POST /admin/operadores | ✓ | ✗ | ✗ |
| GET /admin/tarifas | ✓ | ✗ | ✗ |
| GET /admin/conversaciones | ✗ | ✓ (solo su empresa) | ✓ |
| GET /admin/conversacion/:id | ✗ | ✓ | ✓ |
| POST /admin/responder | ✗ | ✓ | ✓ |
| GET /admin/pedidos | ✗ | ✓ (filtro empresa) | ✓ |
| POST /admin/enviar-guia | ✗ | ✓ | ✓ |
| GET /admin/clientes | ✗ | ✓ (filtro empresa) | ✓ |
| GET /admin/empresa | ✗ | ✓ (su empresa) | ✓ |
| PUT /admin/empresa | ✗ | ✓ (su empresa) | ✓ (restringido) |
| GET /empresas | ✓ | ✗ | ✗ |
| GET /empresas/:id/usuarios | ✓ o misma empresa | ✓ | ✗ |

---

## Modelo de WhatsApp Multi-Empresa

### Opción A: Un número por empresa (recomendado para SaaS)

- Cada empresa tiene su `whatsapp_phone_id` y `whatsapp_token`.
- El webhook recibe `entry[0].changes[0].value.metadata.phone_number_id`.
- Buscas la empresa por ese `phone_number_id` y asignas `empresa_id` al crear el cliente.

### Opción B: Un solo número (más simple)

- Un solo webhook, un solo número.
- Todos los clientes se crean con `empresa_id` de la única empresa activa (o la que configures).
- Solo viable si en la práctica tendrás una sola empresa.

---

## Estructura de Carpetas Sugerida

```
src/
├── app.js
├── config/
├── controllers/
├── routes/
├── modules/
│   ├── auth/
│   ├── admin/           # Solo admin
│   │   ├── dashboard.controller.js
│   │   ├── empresas.controller.js (CRUD empresas)
│   │   ├── operadores.controller.js
│   │   ├── tarifas.controller.js
│   │   └── config-whatsapp.controller.js
│   ├── empresa/         # Panel empresa + usuarios
│   │   ├── empresa.controller.js
│   │   ├── usuarios.controller.js
│   │   └── empresas.routes.js
│   ├── cliente/         # Clientes WhatsApp (con scope empresa)
│   ├── chats/
│   └── pedidos/
├── middleware/
│   ├── auth.middleware.js
│   └── scope.middleware.js   # requireEmpresaScope
└── services/
```

---

## Checklist de Implementación

- [ ] Aplicar migraciones SQL (empresa_id en v_pedidos, empresa_id en pedidos, constraint roles)
- [ ] Crear `requireEmpresaScope` y aplicarlo a rutas de empresa/usuario
- [ ] Corregir `getEmpresa`: devolver empresa por `req.user.empresa_id`
- [ ] Filtrar `getConversaciones` por `empresa_id` (vía clientes_whatsapp)
- [ ] Filtrar `getConversacion` y validar que cliente.empresa_id === req.user.empresa_id
- [ ] Filtrar `getPedidos` por empresa_id (vía v_pedidos.empresa_id o join)
- [ ] Filtrar `getClientes` por empresa_id
- [ ] Actualizar webhook: asignar empresa_id al crear cliente (según modelo WhatsApp elegido)
- [ ] Ajustar `whatsapp.service` para usar token/phone por empresa (si aplica)
- [ ] Añadir sección Usuarios en panel empresa (`/empresas/usuarios.html`)
- [ ] Añadir Perfil empresa con datos bancarios (si no existe)

---

## Resumen

| Componente | Estado actual | Acción |
|------------|---------------|--------|
| Base de datos | Bien estructurada, falta scope | Agregar empresa_id a vistas, constraint roles |
| Chats | Sin filtro empresa | Filtrar por empresa_id |
| Pedidos | Sin filtro empresa | Filtrar por empresa_id |
| Clientes | Sin filtro empresa | Filtrar por empresa_id |
| getEmpresa | Devuelve primera empresa | Usar req.user.empresa_id |
| Webhook | No asigna empresa_id | Mapear phone_number_id → empresa |
| Roles | Inconsistente agente/usuario | Unificar a usuario |
| Panel Admin | Existe | Mantener y reforzar scope |
| Panel Empresa | Existe | Asegurar que todo esté filtrado |
| Operadores | Mezclados en admin | Separar gestión por empresa |
