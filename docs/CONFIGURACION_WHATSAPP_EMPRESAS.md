# Configuración de WhatsApp por Empresa

Cada empresa tiene sus propias credenciales de la API de WhatsApp Business (Meta).

## Requisitos

1. **Cuenta Meta Business** y app en [developers.facebook.com](https://developers.facebook.com)
2. **Phone Number ID** y **Access Token** del número de WhatsApp Business

## Dónde configurar

### Al crear empresa (Admin)
- En el modal "Nueva Empresa", sección "API WhatsApp Business"
- Campos opcionales: Phone Number ID y Access Token

### Después de crear (Admin)
- Botón "Config API" o "Editar API" en la tabla de empresas
- Modal con Phone Number ID y Access Token (ambos obligatorios para enviar mensajes)

## Webhook

El webhook de Meta debe estar configurado para recibir mensajes de todos los números. El sistema identifica la empresa por el `phone_number_id` que Meta envía en cada webhook, mapeándolo con `whatsapp_phone_id` en la tabla `empresas`.

## Migración

Ejecuta `docs/migrations/002_errores_sistema.sql` para añadir `whatsapp_token_encrypted` si no existe.
