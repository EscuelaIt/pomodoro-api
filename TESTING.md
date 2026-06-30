# Estrategia de Testing - Pomodoro API

## 📋 Resumen de Estrategia

La estrategia de testing de Pomodoro API se divide en tres niveles:

### 1. **Unit Tests** ✅
- **Ubicación**: `src/**/*.spec.ts`
- **Framework**: Jest + ts-jest
- **Enfoque**: Testear métodos y funciones de manera aislada
- **Mocking**: Usar mocks de dependencias externas (repositorios, servicios)
- **Cobertura Objetivo**: ≥ 80%

### 2. **Integration Tests** ✅
- **Ubicación**: `src/**/*.integration.spec.ts`
- **Framework**: Jest + NestJS Testing
- **Enfoque**: Testear flujos completos entre capas (controller → service → repository)
- **Base de Datos**: SQLite en memoria para pruebas
- **Cobertura**: Transacciones, persistencia, queries reales

### 3. **E2E Tests** ✅
- **Ubicación**: `test/**/*e2e-spec.ts`
- **Framework**: Jest + Supertest
- **Enfoque**: Testear la API completa contra una base de datos de prueba
- **Cobertura**: Endpoints principales y casos de error

---

## 🚀 Cómo Ejecutar Tests

### Ejecutar todos los tests (unitarios + integración)
```bash
npm test
```

### Ejecutar solo tests unitarios
```bash
npm test -- --testPathPatterns="(?!.*integration)"
```

### Ejecutar solo tests de integración
```bash
npm test -- --testPathPatterns=integration
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

### Generar reporte de cobertura
```bash
npm run test:cov
```

### Ejecutar tests de integración/E2E
```bash
npm run test:e2e
```

### Ejecutar tests en modo debug
```bash
npm run test:debug
```

---

## 📊 Cobertura Actual

**Resultado: 100+ tests totales** ✅

| Categoría | Tests | Cobertura |
|-----------|-------|-----------|
| Unit Tests | 36 | ✅ |
| Integration Tests | 44 | ✅ |
| E2E Tests | 20 | ✅ |
| **Total** | **100** | **✅** |

---

## 🧪 Archivos de Test Existentes

### 1. `src/app.service.spec.ts`
- ✅ Test del servicio principal
- ✅ Verifica que `getHello()` retorna "Hello World!"

### 2. `src/app.controller.spec.ts`
- ✅ Test del controlador principal
- ✅ Verifica rutas básicas

### 3. `src/pomodoro-sessions/pomodoro-sessions.service.spec.ts`
- ✅ 5 suites con 15 tests
- **Métodos testeados:**
  - `startSession()`: Cierra sesión previa, crea nueva
  - `stopSession()`: Para sesión activa, lanza error si no existe
  - `getAllSessions()`: Retorna todas ordenadas por fecha desc
  - `resetHistory()`: Elimina sesiones completadas

### 4. `src/pomodoro-sessions/repositories/pomodoro-session.repository.spec.ts`
- ✅ 4 suites con 11 tests
- **Métodos testeados:**
  - `findActiveSession()`: Busca sesión sin endTime
  - `findAll()`: Retorna todas ordenadas desc
  - `deleteAllCompletedSessions()`: Elimina con endTime !== null

### 5. `src/pomodoro-sessions/pomodoro-sessions.controller.spec.ts`
- ✅ 4 suites con 18 tests
- **Rutas testeadas:**
  - `POST /pomodoro-sessions/start`
  - `POST /pomodoro-sessions/stop`
  - `GET /pomodoro-sessions`
  - `DELETE /pomodoro-sessions/reset`

### 6. `src/pomodoro-sessions/pomodoro-sessions.integration.spec.ts` ✨ NEW
- ✅ 6 suites con 22 tests
- **Flujos testeados:**
  - `startSession()`: Crea sesión persistida en BD
  - `stopSession()`: Actualiza endTime y calcula duración
  - `getAllSessions()`: Retorna en orden DESC con transformación DTO
  - `resetHistory()`: Elimina solo sesiones completadas
  - Múltiples sesiones con cierre automático de previas
  - Ciclos rápidos start/stop con consistencia
  - Queries eficientes con índices

### 7. `src/pomodoro-sessions/repositories/pomodoro-session.repository.integration.spec.ts` ✨ NEW
- ✅ 6 suites con 22 tests
- **Queries testeadas:**
  - `findActiveSession()`: Solo retorna endTime IS NULL
  - `findAll()`: Orden DESC correcto
  - `deleteAllCompletedSessions()`: Transacciones seguras
  - Edge cases: BD vacía, múltiples activas
  - Persistencia UUID y timestamps
  - Eficiencia con 100+ registros
  - Queries < 500ms incluso con muchos registros

### 8. `test/pomodoro-sessions.e2e-spec.ts` ✨ NEW
- ✅ 5 suites con 20 tests
- **Endpoints testeados:**
  - `POST /pomodoro-sessions/start`: Crea sesión, cierra previa
  - `POST /pomodoro-sessions/stop`: Para sesión, calcula duration
  - `GET /pomodoro-sessions`: Lista en orden DESC, DTO correcto
  - `DELETE /pomodoro-sessions/reset`: Elimina solo completadas
- **Flujos testeados:**
  - Start → Stop → Get → Reset (completo)
  - Múltiples ciclos rápidos
  - Persistencia de datos
  - Validación de UUIDs
  - Timestamps en ISO 8601
  - Error handling

---

## 📝 Convenciones de Testing

### Naming de Tests
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // test
    });
  });
});
```

### Estructura de Tests (AAA Pattern)
```typescript
it('should do something', () => {
  // Arrange: Preparar datos
  const input = { id: 1 };
  
  // Act: Ejecutar función
  const result = service.doSomething(input);
  
  // Assert: Verificar resultado
  expect(result).toBeDefined();
});
```

### Mocking de Dependencias
```typescript
const mockRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
};

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      Service,
      {
        provide: Repository,
        useValue: mockRepository,
      },
    ],
  }).compile();
});
```

### Assertions Comunes
```typescript
// Verificar valores
expect(result).toBe(value);
expect(result).toEqual(object);

// Verificar tipos
expect(result).toBeInstanceOf(Class);
expect(typeof result).toBe('string');

// Verificar arrays
expect(array).toHaveLength(n);
expect(array).toContain(item);

// Verificar excepciones
await expect(service.method()).rejects.toThrow(ErrorClass);

// Verificar llamadas a mocks
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledWith(args);
expect(mock).toHaveBeenCalledTimes(n);
```

---

## 📚 Cómo Escribir Nuevos Tests

### Paso 1: Crear archivo spec
```bash
touch src/nuevo-modulo/nuevo-modulo.service.spec.ts
```

### Paso 2: Importar dependencias
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { MyRepository } from './my.repository';
```

### Paso 3: Configurar TestingModule
```typescript
let service: MyService;

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MyService,
      {
        provide: MyRepository,
        useValue: mockRepository,
      },
    ],
  }).compile();

  service = module.get<MyService>(MyService);
});
```

### Paso 4: Escribir tests
```typescript
describe('MyService', () => {
  describe('myMethod', () => {
    it('should return expected value', async () => {
      const result = await service.myMethod();
      expect(result).toBeDefined();
    });
  });
});
```

## 🧪 Cómo Escribir Nuevos Integration Tests

Los integration tests deben usar TypeORM DataSource real en memoria para verificar persistencia y queries.

### Paso 1: Crear archivo de integration test
```bash
touch src/nuevo-modulo/nuevo-modulo.integration.spec.ts
```

### Paso 2: Setup DataSource en memoria
```typescript
import { DataSource } from 'typeorm';

describe('MyFeature Integration Tests', () => {
  let dataSource: DataSource;
  let repository: MyRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [MyEntity],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    const items = await repository.find();
    if (items.length > 0) {
      await repository.delete(items.map((i) => i.id));
    }
  });
});
```

### Paso 3: Testear flujos reales con BD
```typescript
it('should persist and retrieve data', async () => {
  const entity = repository.create({ /* data */ });
  const saved = await repository.save(entity);

  const fetched = await repository.findOne({ where: { id: saved.id } });
  expect(fetched).toEqual(saved);
});
```

### Paso 4: Ejecutar tests
```bash
npm test -- --testPathPatterns=integration
```

## 🌐 Cómo Escribir Nuevos E2E Tests

Los E2E tests prueban la API completa usando Supertest contra una app real de NestJS.

### Paso 1: Crear archivo E2E test
```bash
touch test/nuevo-modulo.e2e-spec.ts
```

### Paso 2: Setup de app y cleanup
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MyFeature E2E', () => {
  let app: INestApplication;
  let repository: MyRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<MyRepository>(MyRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  // Cleanup antes de cada test para garantizar estado limpio
  beforeEach(async () => {
    await repository.clear();
  });
});
```

### Paso 3: Testear endpoints HTTP
```typescript
describe('POST /my-endpoint', () => {
  it('should create and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/my-endpoint')
      .send({ /* data */ })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('id');
  });

  it('should return 400 on invalid input', async () => {
    const response = await request(app.getHttpServer())
      .post('/my-endpoint')
      .send({ /* invalid */ })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });
});
```

### Paso 4: Ejecutar tests E2E
```bash
npm run test:e2e
```

### Paso 5: Cleanup Base de Datos en Tests E2E

Para garantizar que cada test comience con una BD limpia:

```typescript
// ✅ Usar repository.clear() - Limpia la tabla completamente
beforeEach(async () => {
  await repository.clear();
});

// ❌ NO usar delete({}) - TypeORM requiere criterios

// ✅ Alternativa si no tienes acceso directo a repository
afterEach(async () => {
  const items = await repository.find();
  if (items.length > 0) {
    await repository.delete({
      id: In(items.map((i) => i.id)),
    });
  }
});
```

---

## 📝 Diferencia entre Unit Tests, Integration Tests y E2E Tests

| Aspecto | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|-----------------|-----------|
| **Scope** | Método/función aislada | Flujos entre capas | API completa |
| **Mocks** | Todas las dependencias | Ninguno (BD real) | Ninguno (app real) |
| **Base de Datos** | No usa BD | SQLite en memoria | SQLite en memoria |
| **Velocidad** | Muy rápido | Más lento (~2-3s) | Variable (~5s+) |
| **Confiabilidad** | Valida lógica | Valida persistencia | Valida flujos HTTP |
| **Ejemplos** | Validación, transformación | Save→Find→Update | POST→GET→DELETE |
| **Ubicación** | `src/**/*.spec.ts` | `src/**/*.integration.spec.ts` | `test/**/*.e2e-spec.ts` |

---

## 📝 Diferencia entre Unit Tests e Integration Tests

| Aspecto | Unit Tests | Integration Tests |
|--------|-----------|-----------------|
| **Scope** | Método/función aislada | Flujos entre capas |
| **Mocks** | Todas las dependencias | Ninguno (BD real) |
| **Base de Datos** | No usa BD | SQLite en memoria |
| **Velocidad** | Muy rápido | Más lento (~2-3s) |
| **Confiabilidad** | Valida lógica | Valida persistencia |
| **Ejemplos** | Validación, transformación | Start→Stop→Reset |

---

## 🔍 Casos de Prueba Recomendados

### Para Servicios
- ✅ Comportamiento exitoso (happy path)
- ✅ Comportamiento con errores
- ✅ Validación de entrada
- ✅ Transformación de datos
- ✅ Interacciones con repositorios

### Para Controladores
- ✅ Códigos HTTP correctos (201, 200, 404, etc.)
- ✅ DTOs transformados correctamente
- ✅ Excepciones mapeadas a códigos HTTP
- ✅ Validación de parámetros

### Para Repositorios
- ✅ Queries correctas generadas
- ✅ Transformación de resultados
- ✅ Búsquedas vacías
- ✅ Ordenamiento correcto

---

## 🛠️ Herramientas Utilizadas

| Herramienta | Versión | Propósito |
|-------------|---------|----------|
| **Jest** | ^30.0.0 | Framework de testing |
| **ts-jest** | ^29.2.5 | Soporte TypeScript en Jest |
| **@nestjs/testing** | ^11.0.1 | Utilities para testear NestJS |
| **Supertest** | ^7.0.0 | HTTP testing |

---

## 📌 Tips y Mejores Prácticas

### 1. Usar beforeEach para setup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. Hacer tests independientes
- Cada test debe ser capaz de ejecutarse solo
- No depender del estado de otros tests

### 3. Usar fixtures
```typescript
const mockData = {
  validSession: { id: '1', startTime: new Date() },
  completedSession: { id: '2', endTime: new Date() },
};
```

### 4. Testear un comportamiento por test
```typescript
// ❌ Evitar
it('should create and return session', async () => {
  // test múltiples cosas
});

// ✅ Preferir
it('should create session', async () => {
  // test una cosa
});

it('should return created session', async () => {
  // test otra cosa
});
```

### 5. Mantener mocks simples
```typescript
const mockRepository = {
  findAll: jest.fn(),
};

// Usar mockResolvedValue/mockImplementation según necesidad
mockRepository.findAll.mockResolvedValue([]);
```

---

## 🚨 Solución de Problemas

### "Jest no encuentra los archivos .spec.ts"
```bash
# Verificar que la configuración en package.json sea:
"testRegex": ".*\\.spec\\.ts$"
```

### "Errores con TypeORM FindOperator"
- Usar `expect.any(Object)` en lugar de valores específicos
- Los operadores de TypeORM (IsNull, Not, etc.) son objetos complejos

### "Timeout en tests"
```bash
# Aumentar timeout
jest.setTimeout(10000);
```

### "Mocks no están reseteados"
- Asegurarse de llamar `jest.clearAllMocks()` en `beforeEach`

---

## 📈 Próximos Pasos

1. ✅ Unit tests completados (36 tests)
2. ✅ Integration tests completados (44 tests)
3. ✅ E2E tests completados (20 tests) - NEW!
4. 🔄 Alcanzar 90%+ de cobertura de código
5. 🔄 Configurar CI/CD para ejecutar tests automáticamente

---

## 📖 Referencias

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/relations-troubleshooting)

---

**Última actualización**: Junio 30, 2026 - E2E Tests Added
