import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':jobId/messages')
  @ApiOperation({ summary: 'Get all messages for a job chat' })
  @ApiResponse({ status: 200, description: 'List of chat messages ordered by time' })
  @ApiResponse({ status: 403, description: 'User is not a party to this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  getMessages(@Param('jobId') jobId: string, @Request() req: any) {
    return this.chatService.getMessages(jobId, req.user.id);
  }

  @Post(':jobId/messages')
  @ApiOperation({ summary: 'Send a message in a job chat (may trigger AI reply)' })
  @ApiResponse({ status: 201, description: 'Message sent; AI reply auto-appended if LLM is enabled' })
  @ApiResponse({ status: 403, description: 'User is not a party to this job' })
  sendMessage(
    @Param('jobId') jobId: string,
    @Request() req: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(jobId, req.user.id, dto.content);
  }
}
