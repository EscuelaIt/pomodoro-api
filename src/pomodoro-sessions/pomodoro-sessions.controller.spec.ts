import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PomodoroSessionController } from './pomodoro-sessions.controller';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

describe('PomodoroSessionController', () => {
  let controller: PomodoroSessionController;
  let service: PomodoroSessionService;

  const mockSessionDto: PomodoroSessionResponseDto = {
    id: '1',
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: null,
    duration: null,
  };

  const mockCompletedSessionDto: PomodoroSessionResponseDto = {
    id: '2',
    startTime: new Date('2024-01-01T09:00:00'),
    endTime: new Date('2024-01-01T09:25:00'),
    duration: 1500,
  };

  const mockService = {
    startSession: jest.fn(),
    stopSession: jest.fn(),
    getAllSessions: jest.fn(),
    resetHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PomodoroSessionController],
      providers: [
        {
          provide: PomodoroSessionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PomodoroSessionController>(
      PomodoroSessionController,
    );
    service = module.get<PomodoroSessionService>(PomodoroSessionService);

    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should return created session with 201 status', async () => {
      mockService.startSession.mockResolvedValue(mockSessionDto);

      const result = await controller.startSession();

      expect(result).toEqual(mockSessionDto);
      expect(result.id).toBe('1');
      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00'));
      expect(result.endTime).toBeNull();
    });

    it('should call service.startSession', async () => {
      mockService.startSession.mockResolvedValue(mockSessionDto);

      await controller.startSession();

      expect(mockService.startSession).toHaveBeenCalledTimes(1);
    });

    it('should return PomodoroSessionResponseDto instance', async () => {
      mockService.startSession.mockResolvedValue(mockSessionDto);

      const result = await controller.startSession();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
    });
  });

  describe('stopSession', () => {
    it('should return stopped session with 200 status', async () => {
      mockService.stopSession.mockResolvedValue(mockCompletedSessionDto);

      const result = await controller.stopSession();

      expect(result).toEqual(mockCompletedSessionDto);
      expect(result.endTime).not.toBeNull();
      expect(result.duration).toBe(1500);
    });

    it('should call service.stopSession', async () => {
      mockService.stopSession.mockResolvedValue(mockCompletedSessionDto);

      await controller.stopSession();

      expect(mockService.stopSession).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when no active session', async () => {
      mockService.stopSession.mockRejectedValue(
        new BadRequestException('No active pomodoro session to stop'),
      );

      await expect(controller.stopSession()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions as array', async () => {
      const sessions = [mockCompletedSessionDto, mockSessionDto];
      mockService.getAllSessions.mockResolvedValue(sessions);

      const result = await controller.getAllSessions();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should return sessions in descending order by startTime', async () => {
      const sessions = [mockCompletedSessionDto, mockSessionDto];
      mockService.getAllSessions.mockResolvedValue(sessions);

      const result = await controller.getAllSessions();

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should return empty array when no sessions exist', async () => {
      mockService.getAllSessions.mockResolvedValue([]);

      const result = await controller.getAllSessions();

      expect(result).toEqual([]);
    });

    it('should include both active and completed sessions', async () => {
      const sessions = [mockCompletedSessionDto, mockSessionDto];
      mockService.getAllSessions.mockResolvedValue(sessions);

      const result = await controller.getAllSessions();

      const active = result.find((s) => s.endTime === null);
      const completed = result.find((s) => s.endTime !== null);

      expect(active).toBeDefined();
      expect(completed).toBeDefined();
    });

    it('should call service.getAllSessions', async () => {
      mockService.getAllSessions.mockResolvedValue([]);

      await controller.getAllSessions();

      expect(mockService.getAllSessions).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetHistory', () => {
    it('should return success message', async () => {
      const response = {
        message: 'Pomodoro session history has been reset successfully',
      };
      mockService.resetHistory.mockResolvedValue(response);

      const result = await controller.resetHistory();

      expect(result).toEqual(response);
      expect(result.message).toBe('Pomodoro session history has been reset successfully');
    });

    it('should call service.resetHistory', async () => {
      mockService.resetHistory.mockResolvedValue({
        message: 'Pomodoro session history has been reset successfully',
      });

      await controller.resetHistory();

      expect(mockService.resetHistory).toHaveBeenCalledTimes(1);
    });

    it('should return object with message property', async () => {
      const response = {
        message: 'Pomodoro session history has been reset successfully',
      };
      mockService.resetHistory.mockResolvedValue(response);

      const result = await controller.resetHistory();

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });
  });
});
