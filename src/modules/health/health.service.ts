import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    message: string;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const status: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        message: '',
      },
    };

    try {
      const isConnected = await this.prismaService.checkConnection();
      if (isConnected) {
        const result = await this.prismaService.$queryRaw<
          Array<{ now: Date }>
        >`SELECT NOW() as now`;
        status.database.connected = true;
        status.database.message = `Connected successfully. Server time: ${result[0].now.toISOString()}`;
      } else {
        status.status = 'error';
        status.database.connected = false;
        status.database.message = 'Connection check failed';
      }
    } catch (error) {
      status.status = 'error';
      status.database.connected = false;
      status.database.message = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return status;
  }
}
