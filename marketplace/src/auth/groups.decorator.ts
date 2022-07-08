import { SetMetadata } from '@nestjs/common';
import { Group } from 'src/config/enum';

export const GROUPS_KEY = 'groups';
export const OnlyAllowGroups = (...groups: Group[]) =>
  SetMetadata(GROUPS_KEY, groups);
