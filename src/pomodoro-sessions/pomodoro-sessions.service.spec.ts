import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionRepository } from './repositories/pomodoro-session.repository';
import { PomodoroSession } from './entities/pomodoro-session.entity';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

describe('PomodoroSessionService', () => {
  let service: PomodoroSessionService;
  let repository: PomodoroSessionRepository;

  const mockSession: PomodoroSession = {
    id: '1',
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: null,
    createdAt: new Date('2024-01-01T10:00:00'),
  };

  const mockCompletedSession: PomodoroSession = {
    id: '2',
    startTime: new Date('2024-01-01T09:00:00'),
    endTime: new Date('2024-01-01T09:25:00'),
    createdAt: new Date('2024-01-01T09:00:00'),
  };

  const mockRepository = {
    findActiveSession: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    deleteAllCompletedSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PomodoroSessionService,
        {
          provide: PomodoroSessionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PomodoroSessionService>(PomodoroSessionService);
    repository = module.get<PomodoroSessionRepository>(PomodoroSessionRepository);

    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should create and return a new session', async () => {
      const newSession = { ...mockSession };
      mockRepository.findActiveSession.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newSession);
      mockRepository.save.mockResolvedValue(newSession);

      const result = await service.startSession();

      expect(mockRepository.findActiveSession).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        startTime: expect.any(Date),
        endTime: null,
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(PomodoroSessionResponseDto);
      expect(result.id).toBe('1');
    });

    it('should close any active session before creating new one', async () => {
      const newSession = { ...mockSession, id: '2' };
      mockRepository.findActiveSession.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue(newSession);
      mockRepository.create.mockReturnValue(newSession);

      await service.startSession();

      expect(mockRepository.findActiveSession).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenNthCalledWith(1, expect.objectContaining({
        id: '1',
        endTime: expect.any(Date),
      }));
    });
  });

  describe('stopSession', () => {
    it('should stop the active session', async () => {
      const stoppedSession = { ...mockSession, endTime: new Date() };
      mockRepository.findActiveSession.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue(stoppedSession);

      const result = await service.stopSession();

      expect(mockRepository.findActiveSession).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        endTime: expect.any(Date),
      }));
      expect(result).toBeInstanceOf(PomodoroSessionResponseDto);
      expect(result.endTime).not.toBeNull();
    });

    it('should throw BadRequestException when no active session', async () => {
      mockRepository.findActiveSession.mockResolvedValue(null);

      await expect(service.stopSession()).rejects.toThrow(BadRequestException);
      await expect(service.stopSession()).rejects.toThrow(
        'No active pomodoro session to stop',
      );
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions in descending order', async () => {
      const sessions = [mockCompletedSession, mockSession];
      mockRepository.findAll.mockResolvedValue(sessions);

      const result = await service.getAllSessions();

      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PomodoroSessionResponseDto);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should return empty array when no sessions exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllSessions();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetHistory', () => {
    it('should delete all completed sessions and return success message', async () => {
      mockRepository.deleteAllCompletedSessions.mockResolvedValue(undefined);

      const result = await service.resetHistory();

      expect(mockRepository.deleteAllCompletedSessions).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        message: 'Pomodoro session history has been reset successfully',
      });
    });

    it('should only delete sessions with endTime (completed sessions)', async () => {
      mockRepository.deleteAllCompletedSessions.mockResolvedValue(undefined);

      await service.resetHistory();

      expect(mockRepository.deleteAllCompletedSessions).toHaveBeenCalled();
    });
  });
});
