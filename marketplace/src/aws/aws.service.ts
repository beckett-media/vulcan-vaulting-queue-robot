import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import configuration from '../config/configuration';

@Injectable()
export class AwsService {
  constructor() {}

  async uploadItemImage(
    dataBuffer: Buffer,
    prefix: string,
    image_format: string,
  ) {
    const env = process.env['runtime'];
    const config = configuration()[env];
    const s3Config = {
      accessKeyId: config['aws']['AWS_ACCESS_KEY_ID'],
      secretAccessKey: config['aws']['AWS_SECRET_ACCESS_KEY'],
      region: config['aws']['AWS_DEFAULT_REGION'],
    };
    const s3 = new S3(s3Config);
    const uploadResult = await s3
      .upload({
        Bucket: config['aws']['AWS_PUBLIC_BUCKET_NAME'],
        Body: dataBuffer,
        Key: `${prefix}/${uuid()}.${image_format}`,
        ACL: 'public-read',
        ContentType: 'mimetype',
      })
      .promise();
    return uploadResult.Location;
  }
}
