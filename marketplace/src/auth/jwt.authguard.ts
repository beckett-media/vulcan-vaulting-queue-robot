import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import configuration from 'src/config/configuration';
import { DetailedLogger } from 'src/logger/detailed.logger';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new DetailedLogger('JwtAuthGuard', {
    timestamp: true,
  });

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.\
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    const env = process.env['runtime'];
    const authEnabled = configuration()[env]['auth_enabled'];
    if (authEnabled) {
      this.logger.log(
        `handleRequest: err: ${err}, user: ${JSON.stringify(
          user,
        )}, info: ${info}`,
      );
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    } else {
      return { user: '', groups: [] };
    }
  }
}
