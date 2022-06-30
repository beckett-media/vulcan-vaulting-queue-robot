import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import configuration from 'src/config/configuration';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    const env = process.env['runtime'];
    const authEnabled = configuration()[env]['auth_enabled'];
    if (authEnabled) {
      console.log(err);
      console.log(user);
      console.log(info);
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    } else {
      return true;
    }
  }
}
