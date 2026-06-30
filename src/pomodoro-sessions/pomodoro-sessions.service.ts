import { Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PomodoroSessionRepository } from './repositories/pomodoro-session.repository';
import { PomodoroSession } from './entities/pomodoro-session.entity';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

@Injectable()
export class PomodoroSessionService {
  constructor(private readonly sessionRepository: PomodoroSessionRepository) {}

  async startSession(): Promise<PomodoroSessionResponseDto> {
    // Close any active session
    const activeSession = await this.sessionRepository.findActiveSession();
    if (activeSession) {
      activeSession.endTime = new Date();
      await this.sessionRepository.save(activeSession);
    }

    // Create new session
    const newSession = this.sessionRepository.create({
      startTime: new Date(),
      endTime: null,
    });

    const savedSession = await this.sessionRepository.save(newSession);
    return plainToInstance(PomodoroSessionResponseDto, savedSession, {
      excludeExtraneousValues: true,
    });
  }

  async stopSession(): Promise<PomodoroSessionResponseDto> {
    const activeSession = await this.sessionRepository.findActiveSession();

    if (!activeSession) {
      throw new BadRequestException(
        'No active pomodoro session to stop',
      );
    }

    activeSession.endTime = new Date();
    const stoppedSession = await this.sessionRepository.save(activeSession);

    return plainToInstance(PomodoroSessionResponseDto, stoppedSession, {
      excludeExtraneousValues: true,
    });
  }

  async getAllSessions(): Promise<PomodoroSessionResponseDto[]> {
    const sessions = await this.sessionRepository.findAll();
    return plainToInstance(PomodoroSessionResponseDto, sessions, {
      excludeExtraneousValues: true,
    });
  }

  async resetHistory(): Promise<{ message: string }> {
    await this.sessionRepository.deleteAllCompletedSessions();
    return { message: 'Pomodoro session history has been reset successfully' };
  }
}
