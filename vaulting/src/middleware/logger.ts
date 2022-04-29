import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('RequestLogger');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl, path, body, params } = request;
    const baseInfo = `[${ip}] ${method} ${baseUrl}${path}`;
    this.logger.log(
      `${baseInfo} ${JSON.stringify(body)} ${JSON.stringify(params)}}`,
    );
    next();
  }
}
