import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { passportJwtSecret } from 'jwks-rsa';
import configuration from 'src/config/configuration';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const env = process.env['runtime'];
    const config = configuration()[env];
    const authority = `https://cognito-idp.${config['cognito']['COGNITO_REGION']}.amazonaws.com/${config['cognito']['COGNITO_USER_POOL_ID']}`;
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authority}/.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config['cognito']['COGNITO_CLIENT_ID'],
      issuer: authority,
      algorithms: ['RS256'],
    });
  }

  public async validate(payload: any) {
    return !!payload.sub;
  }
}
