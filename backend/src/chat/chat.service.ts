import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../websocket/chat.gateway';
import type { LLMService } from './interfaces/llm.interface';
import { LLM_SERVICE } from './interfaces/llm.interface';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    @Inject(LLM_SERVICE) private llmService: LLMService,
  ) {}

  private async assertParty(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId && job.handymanId !== userId) throw new ForbiddenException();
    return job;
  }

  async getMessages(jobId: string, userId: string) {
    await this.assertParty(jobId, userId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { jobId },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderRole: m.isAI ? 'AI' : m.sender.role,
        content: m.content,
        isAI: m.isAI,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async sendMessage(jobId: string, userId: string, content: string) {
    const job = await this.assertParty(jobId, userId);
    const sender = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, role: true },
    });

    const message = await this.prisma.chatMessage.create({
      data: { jobId, senderId: userId, content, isAI: false },
    });

    const payload = {
      jobId,
      senderId: userId,
      senderName: sender.name,
      senderRole: sender.role as string,
      content,
      isAI: false,
      createdAt: message.createdAt.toISOString(),
    };
    this.chatGateway.emitChatMessage(jobId, payload);

    // LLM assist — stub returns null, no-op
    const aiResponse = await this.llmService.generateResponse(jobId, content);
    if (aiResponse) {
      const aiMessage = await this.prisma.chatMessage.create({
        data: { jobId, senderId: job.clientId, content: aiResponse, isAI: true },
      });
      this.chatGateway.emitChatMessage(jobId, {
        jobId,
        senderId: job.clientId,
        senderName: 'AI Assistant',
        senderRole: 'AI',
        content: aiResponse,
        isAI: true,
        createdAt: aiMessage.createdAt.toISOString(),
      });
    }

    return {
      id: message.id,
      senderId: userId,
      content,
      isAI: false,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
