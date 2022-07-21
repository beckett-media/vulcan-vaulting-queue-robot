import { BullModule } from '@nestjs/bull';
import configuration, { RUNTIME_ENV } from '../config/configuration';

const BullMintQueueModule = BullModule.registerQueue({
  name: configuration()[process.env[RUNTIME_ENV]]['queue']['mint'],
  limiter: configuration()[process.env[RUNTIME_ENV]]['queue']['limiter'],
});

const BullBurnQueueModule = BullModule.registerQueue({
  name: configuration()[process.env[RUNTIME_ENV]]['queue']['burn'],
  limiter: configuration()[process.env[RUNTIME_ENV]]['queue']['limiter'],
});

const BullLockQueueModule = BullModule.registerQueue({
  name: configuration()[process.env[RUNTIME_ENV]]['queue']['lock'],
  limiter: configuration()[process.env[RUNTIME_ENV]]['queue']['limiter'],
});

const BullExecQueueModule = BullModule.registerQueue({
  name: configuration()[process.env[RUNTIME_ENV]]['queue']['exec'],
  limiter: configuration()[process.env[RUNTIME_ENV]]['queue']['limiter'],
});

export {
  BullMintQueueModule,
  BullBurnQueueModule,
  BullLockQueueModule,
  BullExecQueueModule,
};
