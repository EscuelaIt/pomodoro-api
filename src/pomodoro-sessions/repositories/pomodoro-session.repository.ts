import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull, Not } from 'typeorm';
import { PomodoroSession } from '../entities/pomodoro-session.entity';

@Injectable()
export class PomodoroSessionRepository extends Repository<PomodoroSession> {
  constructor(private dataSource: DataSource) {
    super(
      PomodoroSession,
      dataSource.createEntityManager(),
    );
  }

  async findActiveSession(): Promise<PomodoroSession | null> {
    return this.findOne({
      where: {
        endTime: IsNull(),
      },
      order: {
        startTime: 'DESC',
      },
    });
  }

  async findAll(): Promise<PomodoroSession[]> {
    return this.find({
      order: {
        startTime: 'DESC',
      },
    });
  }

  async deleteAllCompletedSessions(): Promise<void> {
    await this.delete({
      endTime: Not(IsNull()),
    });
  }
}
