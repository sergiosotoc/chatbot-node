-- =====================================================
-- Migración 002: Tabla de errores del sistema para soporte
-- El admin puede ver errores específicos para dar soporte
-- =====================================================

CREATE TABLE IF NOT EXISTS errores_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel text NOT NULL DEFAULT 'error',  -- error, warning, critical
  codigo text,                          -- código identificador
  mensaje text NOT NULL,                -- mensaje específico para soporte
  detalle text,                         -- stack trace o datos técnicos
  contexto jsonb,                       -- metadata adicional
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_errores_created ON errores_sistema(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errores_nivel ON errores_sistema(nivel);

-- WhatsApp por empresa (si no existe)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_token_encrypted text;
