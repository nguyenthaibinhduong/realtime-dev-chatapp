import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ description: '2FA verification code (6 digits)' })
  @IsString()
  @Length(6, 6)
  token: string;
}
