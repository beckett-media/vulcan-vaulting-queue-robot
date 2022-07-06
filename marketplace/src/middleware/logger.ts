import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
import { removeBase64 } from 'src/util/format';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('RequestLogger');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl, path, body, params } = request;
    const baseInfo = `[${ip}] ${method} ${baseUrl}${path}`;
    var _body = removeBase64(body);
    var _params = removeBase64(params);

    this.logger.log(
      `${baseInfo} ${JSON.stringify(_body)} ${JSON.stringify(_params)}}`,
    );
    next();
  }
}
