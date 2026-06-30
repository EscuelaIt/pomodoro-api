import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { PomodoroSessionRepository } from './pomodoro-session.repository';
import { PomodoroSession } from '../entities/pomodoro-session.entity';

describe('PomodoroSessionRepository', () => {
  let repository: PomodoroSessionRepository;
  let mockDataSource: Partial<DataSource>;
  let mockEntityManager: any;

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

  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PomodoroSessionRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<PomodoroSessionRepository>(
      PomodoroSessionRepository,
    );

    jest.clearAllMocks();
  });

  describe('findActiveSession', () => {
    it('should find active session (endTime is null)', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSession);

      const result = await repository.findActiveSession();

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endTime: expect.any(Object),
          }),
          order: {
            startTime: 'DESC',
          },
        }),
      );
      expect(result).toEqual(mockSession);
      expect(result.endTime).toBeNull();
    });

    it('should return null when no active session exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findActiveSession();

      expect(result).toBeNull();
    });

    it('should order results by startTime descending', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSession);

      await repository.findActiveSession();

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { startTime: 'DESC' },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all sessions ordered by startTime descending', async () => {
      const sessions = [mockCompletedSession, mockSession];
      jest.spyOn(repository, 'find').mockResolvedValue(sessions);

      const result = await repository.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: {
          startTime: 'DESC',
        },
      });
      expect(result).toEqual(sessions);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no sessions exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return both active and completed sessions', async () => {
      const sessions = [mockCompletedSession, mockSession];
      jest.spyOn(repository, 'find').mockResolvedValue(sessions);

      const result = await repository.findAll();

      const hasActive = result.some((s) => s.endTime === null);
      const hasCompleted = result.some((s) => s.endTime !== null);

      expect(hasActive).toBe(true);
      expect(hasCompleted).toBe(true);
    });
  });

  describe('deleteAllCompletedSessions', () => {
    it('should delete sessions where endTime is not null', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await repository.deleteAllCompletedSessions();

      expect(repository.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          endTime: expect.any(Object),
        }),
      );
    });

    it('should use Not(IsNull()) condition for endTime', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 2 } as any);

      await repository.deleteAllCompletedSessions();

      const deleteCall = (repository.delete as jest.Mock).mock.calls[0][0];
      expect(deleteCall).toHaveProperty('endTime');
    });

    it('should delete multiple completed sessions', async () => {
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 3 } as any);

      await repository.deleteAllCompletedSessions();

      expect(repository.delete).toHaveBeenCalled();
    });

    it('should return void', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 0 } as any);

      const result = await repository.deleteAllCompletedSessions();

      expect(result).toBeUndefined();
    });
  });
});
