import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { removeBase64 } from 'src/util/format';

export interface Response<T> {
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger('ResponseLogger');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // ignore health check
    const handler = context.getHandler().name;
    if (handler && handler.includes('health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        var toLog = removeBase64(data);
        this.logger.log(JSON.stringify(toLog));
        return data;
      }),
    );
  }
}
