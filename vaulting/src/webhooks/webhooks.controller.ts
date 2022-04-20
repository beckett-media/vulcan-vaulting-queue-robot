import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private WebhookService: WebhooksService) {}

  @Post('/callback')
  @ApiOperation({
    summary:
      'Webhook for receiving blockchain events from Openzepplin sentinel',
  })
  async callback(@Body() event: any) {
    await this.WebhookService.callbackHandler(event);
  }
}
