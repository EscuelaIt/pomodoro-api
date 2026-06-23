import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PomodoroSession } from './entities/pomodoro-session.entity';
import { PomodoroSessionRepository } from './repositories/pomodoro-session.repository';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionController } from './pomodoro-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PomodoroSession])],
  controllers: [PomodoroSessionController],
  providers: [PomodoroSessionRepository, PomodoroSessionService],
  exports: [PomodoroSessionService],
})
export class PomodoroSessionModule {}
