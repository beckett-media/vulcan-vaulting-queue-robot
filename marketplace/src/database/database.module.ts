import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from '../config/configuration';
import { Submission, Item, Vaulting, User, Listing } from './database.entity';
import { DatabaseService } from './database.service';

function GetDBConnection(): TypeOrmModuleOptions {
  let env = process.env['runtime'];
  let config = configuration()[env];
  if (env === 'dev') {
    return {
      type: 'sqlite',
      database: config['db']['name'],
      entities: [Submission, Item, Vaulting, User, Listing],
      synchronize: config['db']['sync'],
      keepConnectionAlive: true,
    };
  } else if (env === 'awsdev') {
    return {
      type: 'mysql',
      database: config['db']['name'],
      entities: [Submission, Item, Vaulting, User, Listing],
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
    TypeOrmModule.forFeature([Submission, Item, Vaulting, User, Listing]),
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
