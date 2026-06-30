import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionRepository } from './repositories/pomodoro-session.repository';
import { PomodoroSession } from './entities/pomodoro-session.entity';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

describe('PomodoroSessions Integration Tests', () => {
  let dataSource: DataSource;
  let service: PomodoroSessionService;
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
      providers: [PomodoroSessionRepository, PomodoroSessionService],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    service = module.get<PomodoroSessionService>(PomodoroSessionService);
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

  describe('startSession', () => {
    it('should create a new session with startTime and null endTime', async () => {
      const response = await service.startSession();

      expect(response).toBeInstanceOf(PomodoroSessionResponseDto);
      expect(response.id).toBeDefined();
      expect(response.startTime).toBeDefined();
      expect(response.endTime).toBeNull();
      expect(response.duration).toBeNull();
    });

    it('should persist session to database', async () => {
      const startResponse = await service.startSession();
      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].id).toBe(startResponse.id);
    });

    it('should close previous active session when starting a new one', async () => {
      const firstSession = await service.startSession();
      const firstId = firstSession.id;

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondSession = await service.startSession();
      const secondId = secondSession.id;

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(2);
      const closedFirst = allSessions.find((s) => s.id === firstId);
      const stillOpen = allSessions.find((s) => s.id === secondId);

      expect(closedFirst.endTime).not.toBeNull();
      expect(stillOpen.endTime).toBeNull();
    });

    it('should calculate duration for closed session', async () => {
      const startResponse = await service.startSession();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stopResponse = await service.stopSession();

      expect(stopResponse.duration).toBeGreaterThanOrEqual(0);
      expect(typeof stopResponse.duration).toBe('number');
    });
  });

  describe('stopSession', () => {
    it('should set endTime on active session', async () => {
      await service.startSession();
      const response = await service.stopSession();

      expect(response.endTime).not.toBeNull();
      expect(response.endTime).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when no active session', async () => {
      await expect(service.stopSession()).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.stopSession()).rejects.toThrow(
        'No active pomodoro session to stop',
      );
    });

    it('should persist endTime to database', async () => {
      const startResponse = await service.startSession();
      const sessionId = startResponse.id;

      await service.stopSession();

      const allSessions = await service.getAllSessions();
      const stoppedSession = allSessions.find((s) => s.id === sessionId);

      expect(stoppedSession.endTime).not.toBeNull();
    });

    it('should calculate duration correctly', async () => {
      const startTime = Date.now();
      await service.startSession();

      await new Promise((resolve) => setTimeout(resolve, 150));

      const stopResponse = await service.stopSession();
      const endTime = Date.now();

      const expectedMinDuration = Math.floor(150 / 1000); // ~0 seconds
      const expectedMaxDuration = Math.floor((endTime - startTime) / 1000);

      expect(stopResponse.duration).toBeGreaterThanOrEqual(0);
      expect(stopResponse.duration).toBeLessThanOrEqual(expectedMaxDuration);
    });
  });

  describe('getAllSessions', () => {
    it('should return empty array when no sessions', async () => {
      const sessions = await service.getAllSessions();

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions).toHaveLength(0);
    });

    it('should return all sessions in descending order by startTime', async () => {
      const session1 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const session2 = await service.startSession();

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(2);
      expect(allSessions[0].id).toBe(session2.id);
      expect(allSessions[1].id).toBe(session1.id);
    });

    it('should return DTOs with correct transformation', async () => {
      await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await service.stopSession();

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(1);
      const dto = allSessions[0];

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('startTime');
      expect(dto).toHaveProperty('endTime');
      expect(dto).toHaveProperty('duration');
    });

    it('should return multiple sessions with correct order', async () => {
      const session1 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const session2 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const session3 = await service.startSession();

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(3);
      expect(allSessions[0].id).toBe(session3.id);
      expect(allSessions[1].id).toBe(session2.id);
      expect(allSessions[2].id).toBe(session1.id);
    });
  });

  describe('resetHistory', () => {
    it('should delete only completed sessions', async () => {
      // Create and complete a session
      await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      // Create active session
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.startSession();

      let allSessions = await service.getAllSessions();
      expect(allSessions).toHaveLength(2);

      const resetResult = await service.resetHistory();

      expect(resetResult).toEqual({
        message: 'Pomodoro session history has been reset successfully',
      });

      allSessions = await service.getAllSessions();
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].endTime).toBeNull();
    });

    it('should preserve active sessions when resetting history', async () => {
      // Create multiple sessions with some completed
      await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const activeSession = await service.startSession();

      await service.resetHistory();

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].id).toBe(activeSession.id);
    });

    it('should handle reset when all sessions are completed', async () => {
      await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await service.resetHistory();

      const allSessions = await service.getAllSessions();
      expect(allSessions).toHaveLength(0);
    });

    it('should handle reset when no sessions exist', async () => {
      const result = await service.resetHistory();

      expect(result).toEqual({
        message: 'Pomodoro session history has been reset successfully',
      });

      const allSessions = await service.getAllSessions();
      expect(allSessions).toHaveLength(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple sessions with different states', async () => {
      // Create 3 sessions: 2 completed, 1 active
      const session1 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const session2 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const session3 = await service.startSession();

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(3);
      expect(allSessions[0].id).toBe(session3.id);
      expect(allSessions[0].endTime).toBeNull();
      expect(allSessions[1].id).toBe(session2.id);
      expect(allSessions[1].endTime).not.toBeNull();
      expect(allSessions[2].id).toBe(session1.id);
      expect(allSessions[2].endTime).not.toBeNull();
    });

    it('should handle rapid start/stop cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await service.startSession();
        await new Promise((resolve) => setTimeout(resolve, 20));
        await service.stopSession();
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      const allSessions = await service.getAllSessions();

      expect(allSessions).toHaveLength(5);
      allSessions.forEach((session) => {
        expect(session.endTime).not.toBeNull();
        expect(session.duration).toBeGreaterThanOrEqual(0);
      });
    });

    it('should transition correctly from multiple actives to single active', async () => {
      const session1 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const session2 = await service.startSession();
      const allSessions1 = await service.getAllSessions();

      const session1AfterStart2 = allSessions1.find(
        (s) => s.id === session1.id,
      );
      const session2AfterStart2 = allSessions1.find(
        (s) => s.id === session2.id,
      );

      expect(session1AfterStart2.endTime).not.toBeNull();
      expect(session2AfterStart2.endTime).toBeNull();
    });

    it('should verify database persistence across operations', async () => {
      const session = await service.startSession();
      const sessionId = session.id;

      const dbSession1 = await repository.findOne({
        where: { id: sessionId },
      });
      expect(dbSession1.id).toBe(sessionId);

      await service.stopSession();

      const dbSession2 = await repository.findOne({
        where: { id: sessionId },
      });
      expect(dbSession2.endTime).not.toBeNull();
    });

    it('should ensure transaction consistency', async () => {
      await service.startSession();

      const activeSession = await repository.findActiveSession();
      expect(activeSession).not.toBeNull();

      await service.stopSession();

      const noActiveSession = await repository.findActiveSession();
      expect(noActiveSession).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle querying from empty database', async () => {
      const activeSession = await repository.findActiveSession();
      const allSessions = await repository.findAll();

      expect(activeSession).toBeNull();
      expect(allSessions).toHaveLength(0);
    });

    it('should handle multiple resets', async () => {
      await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await service.resetHistory();
      await service.resetHistory();
      await service.resetHistory();

      const allSessions = await service.getAllSessions();
      expect(allSessions).toHaveLength(0);
    });

    it('should differentiate between null and completed sessions', async () => {
      const session1 = await service.startSession();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await service.stopSession();

      await new Promise((resolve) => setTimeout(resolve, 50));
      const session2 = await service.startSession();

      const completed = await repository.findOne({
        where: { id: session1.id },
      });
      const active = await repository.findOne({
        where: { id: session2.id },
      });

      expect(completed.endTime).not.toBeNull();
      expect(active.endTime).toBeNull();
      expect(typeof completed.endTime.getTime()).toBe('number');
      expect(active.endTime).toBe(null);
    });
  });
});
