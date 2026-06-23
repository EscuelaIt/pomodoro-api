import { Controller, Post, Get } from '@nestjs/common';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

@Controller('pomodoro-sessions')
export class PomodoroSessionController {
  constructor(private readonly sessionService: PomodoroSessionService) {}

  @Post('start')
  async startSession(): Promise<PomodoroSessionResponseDto> {
    return this.sessionService.startSession();
  }

  @Post('stop')
  async stopSession(): Promise<PomodoroSessionResponseDto> {
    return this.sessionService.stopSession();
  }

  @Get()
  async getAllSessions(): Promise<PomodoroSessionResponseDto[]> {
    return this.sessionService.getAllSessions();
  }
}
