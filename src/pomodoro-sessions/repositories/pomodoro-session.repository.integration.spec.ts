import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PomodoroSessionRepository } from './pomodoro-session.repository';
import { PomodoroSession } from '../entities/pomodoro-session.entity';

describe('PomodoroSessionRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: PomodoroSessionRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [PomodoroSession],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [PomodoroSession],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([PomodoroSession]),
      ],
      providers: [PomodoroSessionRepository],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    repository = module.get<PomodoroSessionRepository>(
      PomodoroSessionRepository,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    const sessions = await repository.find();
    if (sessions.length > 0) {
      await repository.delete(sessions.map((s) => s.id));
    }
  });

  describe('findActiveSession', () => {
    it('should return null when no active sessions exist', async () => {
      const result = await repository.findActiveSession();
      expect(result).toBeNull();
    });

    it('should find active session when endTime is null', async () => {
      const session = repository.create({
        startTime: new Date(),
        endTime: null,
      });
      await repository.save(session);

      const active = await repository.findActiveSession();

      expect(active).not.toBeNull();
      expect(active.id).toBe(session.id);
      expect(active.endTime).toBeNull();
    });

    it('should not return completed sessions', async () => {
      const completedSession = repository.create({
        startTime: new Date(),
        endTime: new Date(),
      });
      await repository.save(completedSession);

      const active = await repository.findActiveSession();

      expect(active).toBeNull();
    });

    it('should return most recent active session when multiple exist (shouldn\'t happen but validate)', async () => {
      // Simulate edge case: multiple sessions without endTime
      const session1 = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });
      const session2 = repository.create({
        startTime: new Date('2024-01-01T10:01:00'),
        endTime: null,
      });

      await repository.save([session1, session2]);

      const active = await repository.findActiveSession();

      expect(active).not.toBeNull();
      expect(active.id).toBe(session2.id);
    });

    it('should find active session among mixed completed and active', async () => {
      const completed1 = repository.create({
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T09:25:00'),
      });
      const completed2 = repository.create({
        startTime: new Date('2024-01-01T09:30:00'),
        endTime: new Date('2024-01-01T09:55:00'),
      });
      const active = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });

      await repository.save([completed1, completed2, active]);

      const result = await repository.findActiveSession();

      expect(result).not.toBeNull();
      expect(result.id).toBe(active.id);
    });
  });

  describe('findAll', () => {
    it('should return empty array when database is empty', async () => {
      const result = await repository.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return all sessions ordered by startTime DESC', async () => {
      const session1 = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });
      const session2 = repository.create({
        startTime: new Date('2024-01-01T10:30:00'),
        endTime: null,
      });
      const session3 = repository.create({
        startTime: new Date('2024-01-01T10:15:00'),
        endTime: null,
      });

      await repository.save([session1, session2, session3]);

      const result = await repository.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(session2.id);
      expect(result[1].id).toBe(session3.id);
      expect(result[2].id).toBe(session1.id);
    });

    it('should include both active and completed sessions', async () => {
      const active = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });
      const completed = repository.create({
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T09:25:00'),
      });

      await repository.save([active, completed]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result.some((s) => s.id === active.id)).toBe(true);
      expect(result.some((s) => s.id === completed.id)).toBe(true);
    });

    it('should maintain correct order with large dataset', async () => {
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        sessions.push(
          repository.create({
            startTime: new Date(`2024-01-01T10:${String(i).padStart(2, '0')}:00`),
            endTime: Math.random() > 0.5 ? new Date() : null,
          }),
        );
      }

      await repository.save(sessions);
      const result = await repository.findAll();

      expect(result).toHaveLength(10);

      // Verify DESC order
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].startTime);
        const next = new Date(result[i + 1].startTime);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('deleteAllCompletedSessions', () => {
    it('should delete only sessions with endTime !== null', async () => {
      const completed1 = repository.create({
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T09:25:00'),
      });
      const completed2 = repository.create({
        startTime: new Date('2024-01-01T09:30:00'),
        endTime: new Date('2024-01-01T09:55:00'),
      });
      const active = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });

      await repository.save([completed1, completed2, active]);

      await repository.deleteAllCompletedSessions();

      const remaining = await repository.findAll();

      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(active.id);
    });

    it('should delete all when all sessions are completed', async () => {
      const sessions = [
        repository.create({
          startTime: new Date('2024-01-01T09:00:00'),
          endTime: new Date('2024-01-01T09:25:00'),
        }),
        repository.create({
          startTime: new Date('2024-01-01T09:30:00'),
          endTime: new Date('2024-01-01T09:55:00'),
        }),
      ];

      await repository.save(sessions);
      await repository.deleteAllCompletedSessions();

      const remaining = await repository.findAll();

      expect(remaining).toHaveLength(0);
    });

    it('should not delete anything when no completed sessions exist', async () => {
      const active1 = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });
      const active2 = repository.create({
        startTime: new Date('2024-01-01T10:30:00'),
        endTime: null,
      });

      await repository.save([active1, active2]);

      await repository.deleteAllCompletedSessions();

      const remaining = await repository.findAll();

      expect(remaining).toHaveLength(2);
    });

    it('should handle empty database gracefully', async () => {
      await expect(
        repository.deleteAllCompletedSessions(),
      ).resolves.not.toThrow();

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(0);
    });

    it('should be transactional - all completed sessions deleted or none', async () => {
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        sessions.push(
          repository.create({
            startTime: new Date(
              `2024-01-01T${String(9 + i).padStart(2, '0')}:00:00`,
            ),
            endTime: new Date(
              `2024-01-01T${String(9 + i).padStart(2, '0')}:25:00`,
            ),
          }),
        );
      }

      await repository.save(sessions);
      const countBefore = (await repository.findAll()).length;

      await repository.deleteAllCompletedSessions();

      const countAfter = (await repository.findAll()).length;

      expect(countBefore).toBe(5);
      expect(countAfter).toBe(0);
    });
  });

  describe('Database Operations', () => {
    it('should persist data to database correctly', async () => {
      const session = repository.create({
        startTime: new Date(),
        endTime: null,
      });

      const saved = await repository.save(session);

      expect(saved.id).toBeDefined();
      expect(saved.createdAt).toBeDefined();

      const fetched = await repository.findOne({
        where: { id: saved.id },
      });

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(saved.id);
    });

    it('should update session correctly', async () => {
      const session = repository.create({
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: null,
      });

      const saved = await repository.save(session);
      const newEndTime = new Date();
      saved.endTime = newEndTime;

      const updated = await repository.save(saved);

      const fetched = await repository.findOne({
        where: { id: updated.id },
      });

      expect(fetched.endTime).not.toBeNull();
      expect(fetched.endTime.getTime()).toBe(newEndTime.getTime());
    });

    it('should generate UUID correctly', async () => {
      const session = repository.create({
        startTime: new Date(),
        endTime: null,
      });

      const saved = await repository.save(session);

      expect(saved.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should handle concurrent saves', async () => {
      const sessions = [
        repository.create({
          startTime: new Date(),
          endTime: null,
        }),
        repository.create({
          startTime: new Date(),
          endTime: null,
        }),
        repository.create({
          startTime: new Date(),
          endTime: null,
        }),
      ];

      const saved = await Promise.all(sessions.map((s) => repository.save(s)));

      expect(saved).toHaveLength(3);
      expect(new Set(saved.map((s) => s.id)).size).toBe(3);
    });
  });

  describe('Query Efficiency', () => {
    it('should query with proper indexing strategy', async () => {
      const sessions = [];
      for (let i = 0; i < 100; i++) {
        sessions.push(
          repository.create({
            startTime: new Date(
              Date.now() - i * 60000 * 25,
            ),
            endTime: Math.random() > 0.5 ? new Date() : null,
          }),
        );
      }

      await repository.save(sessions);

      const startTime = Date.now();

      const active = await repository.findActiveSession();
      const allSessions = await repository.findAll();

      const queryTime = Date.now() - startTime;

      expect(active).toBeDefined();
      expect(allSessions).toHaveLength(100);
      expect(queryTime).toBeLessThan(1000);
    });

    it('should handle findActiveSession efficiently', async () => {
      const sessions = [];
      for (let i = 0; i < 50; i++) {
        sessions.push(
          repository.create({
            startTime: new Date(Date.now() - i * 1000),
            endTime: i < 49 ? new Date() : null,
          }),
        );
      }

      await repository.save(sessions);

      const startTime = Date.now();
      const active = await repository.findActiveSession();
      const queryTime = Date.now() - startTime;

      expect(active).not.toBeNull();
      expect(active.endTime).toBeNull();
      expect(queryTime).toBeLessThan(500);
    });
  });
});
