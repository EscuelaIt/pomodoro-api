import { Expose, Transform } from 'class-transformer';

export class PomodoroSessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date | null;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.endTime) {
      return Math.floor(
        (new Date(obj.endTime).getTime() -
          new Date(obj.startTime).getTime()) /
          1000,
      );
    }
    return null;
  })
  duration: number | null;
}
