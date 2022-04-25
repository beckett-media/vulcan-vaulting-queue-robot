import { BullModule } from '@nestjs/bull';
import configuration from '../config/configuration';

const BullMintQueueModule = BullModule.registerQueue({
  name: configuration()[process.env['runtime']]['queue']['mint'],
  limiter: configuration()[process.env['runtime']]['queue']['limiter'],
});

const BullBurnQueueModule = BullModule.registerQueue({
  name: configuration()[process.env['runtime']]['queue']['burn'],
  limiter: configuration()[process.env['runtime']]['queue']['limiter'],
});

export { BullMintQueueModule, BullBurnQueueModule };
