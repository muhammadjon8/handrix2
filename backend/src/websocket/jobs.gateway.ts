import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

@WebSocketGateway({ namespace: '/jobs', cors: { origin: '*' } })
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; role: string }>(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Join all active job rooms the user is party to
      const activeJobs = await this.prisma.job.findMany({
        where: {
          OR: [{ clientId: payload.sub }, { handymanId: payload.sub }],
          status: {
            notIn: [JobStatus.COMPLETED, JobStatus.CANCELLED],
          },
        },
        select: { id: true },
      });
      for (const job of activeJobs) {
        await client.join(`job:${job.id}`);
      }
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    client.data.userId = undefined;
  }

  // ─── Emission helpers (called by services) ──────────────────────────────

  emitJobMatched(
    jobId: string,
    payload: { jobId: string; handymanName: string; handymanAvatar: string | null; eta: string },
  ) {
    this.server.to(`job:${jobId}`).emit('job:matched', payload);
  }

  emitJobAvailable(
    handymanSocketId: string,
    payload: {
      jobId: string;
      categoryName: string;
      distanceKm: number;
      payoutEstimate: number;
      eta: string;
    },
  ) {
    this.server.to(handymanSocketId).emit('job:available', payload);
  }

  emitJobStatusUpdate(
    jobId: string,
    payload: { jobId: string; status: string; updatedAt: string },
  ) {
    this.server.to(`job:${jobId}`).emit('job:status_update', payload);
  }

  emitJobCompleted(
    jobId: string,
    payload: { jobId: string; finalPrice: number; warrantyId: string },
  ) {
    this.server.to(`job:${jobId}`).emit('job:completed', payload);
  }

  emitHandymanLocation(
    jobId: string,
    payload: { jobId: string; lat: number; lng: number; eta: string | null },
  ) {
    this.server.to(`job:${jobId}`).emit('handyman:location', payload);
  }

  async joinJobRoom(userId: string, jobId: string) {
    const sockets = await this.server.fetchSockets();
    const userSockets = sockets.filter((s) => s.data.userId === userId);
    for (const s of userSockets) {
      await s.join(`job:${jobId}`);
    }
  }
}
