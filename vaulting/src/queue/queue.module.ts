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

const BullLockQueueModule = BullModule.registerQueue({
  name: configuration()[process.env['runtime']]['queue']['lock'],
  limiter: configuration()[process.env['runtime']]['queue']['limiter'],
});

const BullExecQueueModule = BullModule.registerQueue({
  name: configuration()[process.env['runtime']]['queue']['exec'],
  limiter: configuration()[process.env['runtime']]['queue']['limiter'],
});

const BullMemorydbQueueModule = BullModule.registerQueue({
  name: configuration()[process.env['runtime']]['queue']['memorydb'],
  limiter: configuration()[process.env['runtime']]['queue']['limiter'],
});

export {
  BullMintQueueModule,
  BullBurnQueueModule,
  BullLockQueueModule,
  BullExecQueueModule,
  BullMemorydbQueueModule,
};
