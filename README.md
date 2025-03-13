
# Sistema de Reserva del Quincho FIUNA

## Descripción del Proyecto

Este proyecto es un sistema de gestión de reservas para el Quincho de la Facultad de Ingeniería de la Universidad Nacional de Asunción (FIUNA). La aplicación permite a los usuarios ver la disponibilidad del espacio en un calendario, hacer reservas y a los administradores gestionar las reservas existentes.

## Características Principales

- Calendario interactivo para visualizar reservas existentes
- Sistema de reservas con validación de disponibilidad
- Panel de administración para gestionar reservas
- Autenticación segura para administradores
- Interfaz adaptable a dispositivos móviles y de escritorio

## Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Backend y Autenticación**: Supabase
- **Estado y Peticiones**: TanStack Query (React Query)
- **Routing**: React Router
- **Notificaciones**: Sonner

## Desarrollo Local

Para ejecutar este proyecto en tu entorno local, sigue estos pasos:

```sh
# Paso 1: Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# Paso 2: Navegar al directorio del proyecto
cd <NOMBRE_DEL_PROYECTO>

# Paso 3: Instalar las dependencias necesarias
npm install

# Paso 4: Iniciar el servidor de desarrollo con recarga automática
npm run dev
```

## Estructura del Proyecto

- `/src/components`: Componentes reutilizables de la interfaz
- `/src/pages`: Páginas principales de la aplicación
- `/src/hooks`: Hooks personalizados para la lógica de la aplicación
- `/src/context`: Proveedores de contexto para el estado global
- `/src/types`: Definiciones de tipos TypeScript
- `/src/utils`: Funciones utilitarias 
- `/src/integrations`: Configuración de integraciones externas (Supabase)

## Despliegue

La aplicación está configurada para ser desplegada automáticamente en Vercel. Cualquier cambio en la rama principal desencadenará una nueva compilación y despliegue.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir a este proyecto:

1. Crea un fork del repositorio
2. Crea una nueva rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva característica'`)
4. Sube tus cambios (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
