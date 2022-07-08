import { Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import configuration from 'src/config/configuration';

@Injectable()
export class AuthService {
  private userPool: CognitoUserPool;
  constructor() {
    const env = process.env['runtime'];
    const config = configuration()[env];
    this.userPool = new CognitoUserPool({
      UserPoolId: config['cognito']['COGNITO_USER_POOL_ID'],
      ClientId: config['cognito']['COGNITO_CLIENT_ID'],
    });
  }

  authenticateUser(user: {
    name: string;
    password: string;
  }): Promise<CognitoUserSession> {
    const { name, password } = user;
    const authenticationDetails = new AuthenticationDetails({
      Username: name,
      Password: password,
    });
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      return newUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }
}
