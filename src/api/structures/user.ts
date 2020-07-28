import { Collections, Structures } from 'detritus-client';

import {
  UserFlags,
  UserPremiumTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysUser = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BOT,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.USERNAME,
  NotSoApiKeys.PREMIUM_TYPE,
]);

export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: string | null = null;
  blocked: boolean = false;
  bot: boolean = false;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  username: string = '';
  premiumType: UserPremiumTypes = UserPremiumTypes.NONE;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  hasOwner(): boolean {
    return this.hasFlag(UserFlags.OWNER);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }
}
