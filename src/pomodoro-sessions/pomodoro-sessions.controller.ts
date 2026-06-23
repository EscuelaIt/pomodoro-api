import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PomodoroSessionService } from './pomodoro-sessions.service';
import { PomodoroSessionResponseDto } from './dto/pomodoro-session.response.dto';

@Controller('pomodoro-sessions')
@ApiTags('Pomodoro Sessions')
export class PomodoroSessionController {
  constructor(private readonly sessionService: PomodoroSessionService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new pomodoro session' })
  @ApiResponse({
    status: 201,
    description: 'Session started successfully',
    type: PomodoroSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async startSession(): Promise<PomodoroSessionResponseDto> {
    return this.sessionService.startSession();
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the current pomodoro session' })
  @ApiResponse({
    status: 200,
    description: 'Session stopped successfully',
    type: PomodoroSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No active session found' })
  async stopSession(): Promise<PomodoroSessionResponseDto> {
    return this.sessionService.stopSession();
  }

  @Get()
  @ApiOperation({ summary: 'Get all pomodoro sessions' })
  @ApiResponse({
    status: 200,
    description: 'List of sessions retrieved',
    type: [PomodoroSessionResponseDto],
  })
  async getAllSessions(): Promise<PomodoroSessionResponseDto[]> {
    return this.sessionService.getAllSessions();
  }
}
