import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getHello(): { message: string; timestamp: string; version: string } {
    return {
      message: 'DevChat API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string; uptime: number } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
    };
  }
}
