# Pomodoro API - Backend

Backend API para gestionar sesiones de Pomodoro. Construido con arquitectura modular basada en NestJS.

## 🏗️ Tecnologías Utilizadas

### Framework & Runtime
- **NestJS 11**: Framework de Node.js basado en TypeScript para construir APIs escalables
- **TypeScript 5.7**: Lenguaje de programación con tipado estático
- **Node.js**: Runtime de ejecución

### Base de Datos & ORM
- **TypeORM 1.0**: ORM para mapear objetos a la base de datos
- **SQLite 3**: Base de datos relacional embebida

### Documentación & API
- **Swagger/OpenAPI**: Documentación interactiva de la API
- **@nestjs/swagger**: Decoradores para generar documentación automática

### Validación & Transformación
- **class-validator**: Decoradores para validación de datos
- **class-transformer**: Transformación de DTOs y entidades
- **reflect-metadata**: Metadatos para decoradores

### Testing
- **Jest 30**: Framework de testing
- **ts-jest**: Soporte para TypeScript en Jest
- **supertest**: HTTP testing para API

### Calidad de Código
- **ESLint 9**: Linter de JavaScript/TypeScript
- **Prettier 3**: Formateador de código
- **typescript-eslint**: Plugin de ESLint para TypeScript

### Desarrollo
- **@nestjs/cli**: CLI de NestJS para generar módulos y componentes
- **ts-node**: Ejecución directa de TypeScript
- **ts-loader**: Cargador de TypeScript para webpack

## 📁 Estructura del Proyecto

```
src/
├── main.ts                           # Punto de entrada de la aplicación
├── app.module.ts                     # Módulo principal
├── app.controller.ts                 # Controlador principal
├── app.service.ts                    # Servicio principal
├── pomodoro-sessions/                # Módulo de Sesiones Pomodoro
│   ├── pomodoro-sessions.module.ts
│   ├── pomodoro-sessions.controller.ts
│   ├── pomodoro-sessions.service.ts
│   ├── dto/                          # Data Transfer Objects
│   │   └── pomodoro-session.response.dto.ts
│   ├── entities/                     # Entidades TypeORM
│   │   └── pomodoro-session.entity.ts
│   └── repositories/                 # Repositorios personalizados
│       └── pomodoro-session.repository.ts

test/
├── app.e2e-spec.ts                   # Tests end-to-end
└── jest-e2e.json                     # Configuración Jest para E2E
```

## 🏛️ Arquitectura

La aplicación sigue la arquitectura modular de NestJS:

- **Módulos**: Unidades organizativas que agrupan funcionalidad relacionada
- **Controladores**: Manejan las rutas HTTP y delegación de lógica
- **Servicios**: Contienen la lógica de negocio
- **Repositorios**: Abstracción de acceso a datos
- **Entidades**: Modelos de datos mapeados a la base de datos
- **DTOs**: Objetos para transferencia de datos en solicitudes/respuestas

## 📋 Scripts Disponibles

### Desarrollo
```bash
npm run start:dev      # Inicia servidor en modo watch
npm run start:debug    # Inicia servidor en modo debug con watch
npm run start          # Inicia servidor normal
npm run start:prod     # Inicia servidor con distribución optimizada
```

### Build & Packaging
```bash
npm run build          # Compila el proyecto TypeScript
```

### Testing
```bash
npm test              # Ejecuta todos los tests
npm run test:watch   # Ejecuta tests en modo watch
npm run test:cov     # Genera reporte de coverage
npm run test:e2e     # Ejecuta tests end-to-end
```

### Calidad de Código
```bash
npm run lint          # Ejecuta ESLint y corrige automáticamente
npm run format        # Formatea código con Prettier
```

## � Documentación OpenAPI / Swagger

### ¿Cómo acceder a la documentación?

1. **Inicia el servidor** (en modo desarrollo):
   ```bash
   npm run start:dev
   ```

2. **Abre tu navegador** y ve a:
   ```
   http://localhost:3000/api/docs
   ```

   Para agentes se puede acceder a la documentación con:
   ```
   http://localhost:3000/api/docs-json
   ```
   
3. **Verás la interfaz interactiva de Swagger UI** donde podrás:
   - Visualizar todos los endpoints disponibles
   - Ver esquemas de request/response
   - Probar los endpoints directamente desde el navegador
   - Descargar la especificación OpenAPI en JSON/YAML

### Configuración de Swagger

La configuración está en [src/main.ts](src/main.ts):
- **Título**: Pomodoro API
- **Descripción**: API para gestionar sesiones de Pomodoro
- **Versión**: 1.0
- **Ruta de documentación**: `/api/docs`

## 🔌 Configuración API

- **Puerto por defecto**: 3000 (configurable con `PORT` env variable)
- **Host**: http://localhost:3000

## 📦 Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|----------|
| @nestjs/common | ^11.0.1 | Core de NestJS |
| @nestjs/core | ^11.0.1 | Funcionalidad principal |
| @nestjs/platform-express | ^11.0.1 | Adaptador HTTP |
| @nestjs/typeorm | ^11.0.2 | Integración TypeORM |
| @nestjs/swagger | ^11.4.4 | Documentación API |
| typeorm | ^1.0.0 | ORM |
| sqlite3 | ^6.0.1 | Driver de BD |
| class-validator | ^0.15.1 | Validación |
| rxjs | ^7.8.1 | Programación reactiva |

## 🎯 Estándares de Desarrollo

- **Lenguaje**: TypeScript (no usar JavaScript puro)
- **Tipado**: Siempre usar tipado estático fuerte
- **Formato**: Prettier (automático con pre-commit)
- **Lint**: ESLint con configuración TypeScript
- **Testing**: Jest con cobertura mínima recomendada
- **Validación**: Usar decoradores de class-validator en DTOs

## 🚀 Próximos Pasos

1. Configurar variables de entorno (.env)
2. Ejecutar migraciones de base de datos si aplica
3. Pobluar base de datos inicial si es necesario
4. Iniciar servidor en desarrollo con `npm run start:dev`
