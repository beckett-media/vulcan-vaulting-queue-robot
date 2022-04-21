import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private WebhookService: WebhooksService) {}

  @Post('/sentinel')
  @ApiOperation({
    summary:
      'Webhook for receiving blockchain events from Openzepplin sentinel',
  })
  async callback(@Body() event: any) {
    const status = await this.WebhookService.callbackHandler(event);
    return { status: status };
  }
}
