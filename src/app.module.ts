import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PomodoroSession } from './pomodoro-sessions/entities/pomodoro-session.entity';
import { PomodoroSessionModule } from './pomodoro-sessions/pomodoro-sessions.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'pomodoro.sqlite',
      entities: [PomodoroSession],
      synchronize: true,
      logging: false,
    }),
    PomodoroSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
