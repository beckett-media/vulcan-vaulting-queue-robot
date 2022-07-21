import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { Token, Vaulting } from './database.entity';
import { DatabaseService } from './database.service';

function GetDBConnection(): TypeOrmModuleOptions {
  let env = process.env[RUNTIME_ENV];
  let config = configuration()[env];
  if (env === 'dev') {
    return {
      type: 'sqlite',
      database: config['db']['name'],
      entities: [Vaulting, Token],
      synchronize: config['db']['sync'],
      keepConnectionAlive: true,
    };
  } else if (env === 'awsdev') {
    return {
      type: 'mysql',
      database: config['db']['name'],
      entities: [Vaulting, Token],
      synchronize: config['db']['sync'],
      keepConnectionAlive: true,
      host: config['db']['host'],
      port: config['db']['port'],
      username: config['db']['username'],
      password: config['db']['password'],
    };
  }

  return {};
}

@Module({
  providers: [DatabaseService],
  imports: [
    TypeOrmModule.forRoot(GetDBConnection()),
    TypeOrmModule.forFeature([Vaulting, Token]),
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
