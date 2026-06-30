import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PomodoroSessionRepository } from '../src/pomodoro-sessions/repositories/pomodoro-session.repository';

describe('Pomodoro Sessions E2E', () => {
  let app: INestApplication<App>;
  let sessionRepository: PomodoroSessionRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepository = moduleFixture.get<PomodoroSessionRepository>(
      PomodoroSessionRepository,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // Reset database before each test to ensure clean state
  beforeEach(async () => {
    await sessionRepository.clear();
  });

  describe('POST /pomodoro-sessions/start', () => {
    it('should create a new session and return 201 with session object', async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body).toHaveProperty('duration');
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(response.body.endTime).toBeNull();
      expect(response.body.duration).toBeNull();
    });

    it('should generate valid ISO 8601 timestamp for startTime', async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const startTime = new Date(response.body.startTime);
      expect(startTime.toISOString()).toBe(response.body.startTime);
    });

    it('should close previous active session when starting a new one', async () => {
      // Start first session
      const firstResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const firstSessionId = firstResponse.body.id;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start second session
      const secondResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const secondSessionId = secondResponse.body.id;
      expect(secondSessionId).not.toBe(firstSessionId);

      // Get all sessions
      const allSessions = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(allSessions.body).toHaveLength(2);

      // First session should now have endTime set
      const closedSession = allSessions.body.find(
        (s: any) => s.id === firstSessionId,
      );
      expect(closedSession.endTime).not.toBeNull();
      expect(closedSession.duration).not.toBeNull();
    });
  });

  describe('POST /pomodoro-sessions/stop', () => {
    it('should stop active session and return 200 with endTime and duration', async () => {
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body).toHaveProperty('duration');
      expect(response.body.endTime).not.toBeNull();
      expect(response.body.duration).not.toBeNull();
      expect(typeof response.body.duration).toBe('number');
    });

    it('should calculate duration correctly in seconds', async () => {
      const startResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const startTime = new Date(startResponse.body.startTime).getTime();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const stopResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(200);

      const endTime = new Date(stopResponse.body.endTime).getTime();
      const expectedDuration = Math.floor((endTime - startTime) / 1000);

      expect(stopResponse.body.duration).toBe(expectedDuration);
    });

    it('should return 400 BadRequest when stopping without active session', async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No active pomodoro session');
    });

    it('should generate valid ISO 8601 timestamp for endTime', async () => {
      await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(200);

      const endTime = new Date(response.body.endTime);
      expect(endTime.toISOString()).toBe(response.body.endTime);
    });
  });

  describe('GET /pomodoro-sessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual([]);
    });

    it('should return array of all sessions in descending order by startTime', async () => {
      // Create first session
      const firstStart = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Stop first and create second
      await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const secondStart = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveLength(2);
      // Should be in DESC order (newest first)
      expect(new Date(response.body[0].startTime).getTime()).toBeGreaterThanOrEqual(
        new Date(response.body[1].startTime).getTime(),
      );
    });

    it('should return sessions with correct DTO structure', async () => {
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);

      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(response.body).toHaveLength(1);
      const session = response.body[0];

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('startTime');
      expect(session).toHaveProperty('endTime');
      expect(session).toHaveProperty('duration');
      expect(typeof session.id).toBe('string');
      expect(typeof session.startTime).toBe('string');
      expect(session.endTime).toBeNull();
      expect(session.duration).toBeNull();
    });

    it('should return multiple sessions with persistent data', async () => {
      // Create and stop first session
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create and stop second session
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);

      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].endTime).not.toBeNull();
      expect(response.body[1].endTime).not.toBeNull();
    });
  });

  describe('DELETE /pomodoro-sessions/reset', () => {
    it('should reset completed sessions and return 200 with success message', async () => {
      // Create and stop a session
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);

      const response = await request(app.getHttpServer())
        .delete('/pomodoro-sessions/reset')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset successfully');
    });

    it('should only delete completed sessions, preserving active ones', async () => {
      // Create first completed session
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create active session (don't stop it)
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);

      // Reset
      await request(app.getHttpServer()).delete('/pomodoro-sessions/reset').expect(200);

      // Should have only the active session
      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].endTime).toBeNull();
      expect(response.body[0].duration).toBeNull();
    });

    it('should handle reset on empty history without error', async () => {
      const response = await request(app.getHttpServer())
        .delete('/pomodoro-sessions/reset')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Complete workflow scenarios', () => {
    it('should handle complete flow: start → stop → get → reset', async () => {
      // 1. Start session
      const startResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/start')
        .expect(201);

      const sessionId = startResponse.body.id;
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      // 2. Stop session
      const stopResponse = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(200);

      expect(stopResponse.body.id).toBe(sessionId);
      expect(stopResponse.body.endTime).not.toBeNull();
      expect(stopResponse.body.duration).toBeGreaterThanOrEqual(0);

      // 3. Get all sessions
      const getResponse = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].id).toBe(sessionId);

      // 4. Reset
      const resetResponse = await request(app.getHttpServer())
        .delete('/pomodoro-sessions/reset')
        .expect(200);

      expect(resetResponse.body).toHaveProperty('message');

      // 5. Verify all cleared
      const finalResponse = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(finalResponse.body).toHaveLength(0);
    });

    it('should handle multiple rapid start/stop cycles', async () => {
      const cycles = 3;

      for (let i = 0; i < cycles; i++) {
        await request(app.getHttpServer())
          .post('/pomodoro-sessions/start')
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 50));

        await request(app.getHttpServer())
          .post('/pomodoro-sessions/stop')
          .expect(200);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(response.body).toHaveLength(cycles);
      expect(response.body.every((s: any) => s.duration !== null)).toBe(true);
    });

    it('should maintain data consistency across all operations', async () => {
      // Create 3 sessions
      const sessionIds = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/pomodoro-sessions/start')
          .expect(201);

        sessionIds.push(response.body.id);
        await new Promise((resolve) => setTimeout(resolve, 30));

        if (i < 2) {
          await request(app.getHttpServer()).post('/pomodoro-sessions/stop').expect(200);
        }
      }

      // Get all
      const allResponse = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(allResponse.body).toHaveLength(3);
      expect(allResponse.body.map((s: any) => s.id)).toEqual(
        expect.arrayContaining(sessionIds),
      );

      // Verify data integrity: 2 completed, 1 active
      const completed = allResponse.body.filter((s: any) => s.endTime !== null);
      const active = allResponse.body.filter((s: any) => s.endTime === null);

      expect(completed).toHaveLength(2);
      expect(active).toHaveLength(1);

      // Reset should only remove completed
      await request(app.getHttpServer()).delete('/pomodoro-sessions/reset').expect(200);

      const finalResponse = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      expect(finalResponse.body).toHaveLength(1);
      expect(finalResponse.body[0].endTime).toBeNull();
    });
  });

  describe('Error handling and validation', () => {
    it('should return proper error response format', async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro-sessions/stop')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.statusCode).toBe(400);
    });

    it('should validate all returned UUIDs are valid format', async () => {
      await request(app.getHttpServer()).post('/pomodoro-sessions/start').expect(201);

      const response = await request(app.getHttpServer())
        .get('/pomodoro-sessions')
        .expect(200);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      response.body.forEach((session: any) => {
        expect(session.id).toMatch(uuidRegex);
      });
    });
  });
});
