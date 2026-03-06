-- =====================================================
-- Migración 001: Preparar base de datos para SaaS multi-tenant
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Empresas: campos para WhatsApp por empresa (opcional)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_phone_id text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Operadores: unificar roles (agente -> usuario)
UPDATE operadores SET rol = 'usuario' WHERE rol = 'agente' OR rol IS NULL;

-- 3. Pedidos: agregar empresa_id para filtrado eficiente
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);

-- Migrar datos existentes (pedidos sin empresa_id)
UPDATE pedidos p
SET empresa_id = cw.empresa_id
FROM clientes_whatsapp cw
WHERE p.cliente_id = cw.id AND p.empresa_id IS NULL;

-- 4. Vista v_pedidos: incluir empresa_id para filtrado
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
  cw.empresa_id
FROM pedidos p
LEFT JOIN clientes_whatsapp cw ON p.cliente_id = cw.id;

-- 5. Constraint de roles (opcional, descomenta si quieres forzar)
-- ALTER TABLE operadores DROP CONSTRAINT IF EXISTS operadores_rol_check;
-- ALTER TABLE operadores ADD CONSTRAINT operadores_rol_check 
--   CHECK (rol IN ('admin', 'empresa', 'usuario'));
