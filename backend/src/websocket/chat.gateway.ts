import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
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
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string; content: string },
  ) {
    if (!client.data.userId) {
      client.emit('error', { message: 'Unauthenticated' });
      return;
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: client.data.userId },
      select: { id: true, name: true, role: true },
    });
    if (!sender) return;

    const message = await this.prisma.chatMessage.create({
      data: {
        jobId: data.jobId,
        senderId: sender.id,
        content: data.content,
        isAI: false,
      },
    });

    const payload = {
      jobId: data.jobId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      content: data.content,
      isAI: false,
      createdAt: message.createdAt.toISOString(),
    };

    this.server.to(`chat:${data.jobId}`).emit('chat:message', payload);
    await client.join(`chat:${data.jobId}`);
  }

  emitChatMessage(
    jobId: string,
    payload: {
      jobId: string;
      senderId: string;
      senderName: string;
      senderRole: string;
      content: string;
      isAI: boolean;
      createdAt: string;
    },
  ) {
    this.server.to(`chat:${jobId}`).emit('chat:message', payload);
  }
}
