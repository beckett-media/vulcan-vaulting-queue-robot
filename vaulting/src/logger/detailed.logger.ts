import { Logger } from '@nestjs/common';
import { RUNTIME_ENV } from 'src/config/configuration';

/**
 * Error examples:
 *
 * Error:
    at DetailedLogger.log (/home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/src/logger/detailed.logger.ts:9:17)
    at MintNFTConsumer.mintNFT (/home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/src/vaulting/vaulting.consumer.ts:25:17)
    at handlers.<computed> (/home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/node_modules/bull/lib/queue.js:697:42)
    at Queue.processJob (/home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/node_modules/bull/lib/queue.js:1158:22)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)


    Error:
    at DetailedLogger.log (/home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/src/logger/detailed.logger.ts:16:17)
    at /home/yifan/projects/vulcan-vaulting-queue-robot/vaulting/src/database/database.service.ts:55:25
 */

export class DetailedLogger extends Logger {
  log(message: any, context?: string) {
    var callets: Array<string>;
    var caller: string;
    var lines: Array<string>;
    const callerLineSplits = new Error().stack.split('\n')[2].trim().split(' ');
    if (callerLineSplits.length > 2) {
      callets = callerLineSplits[1].split('.');
      caller = callets[callets.length - 1];
      lines = callerLineSplits[2].split('/');
    } else {
      caller = 'unknown';
      lines = callerLineSplits[1].split('/');
    }

    if (
      process.env[RUNTIME_ENV] == 'dev' ||
      process.env[RUNTIME_ENV] == 'awsdev'
    ) {
      const line = lines[lines.length - 1].split(')')[0];
      super.log(`<${caller}(), ${line}> ${message}`);
    } else {
      super.log(`<${caller}()> ${message}`);
    }
  }
}
