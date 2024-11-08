import { Collections, Structures } from 'detritus-client';

import {
  GoogleLocales,
  UserFlags,
  UserPremiumTypes,
  UserFallbacksMediaImageTypes,
  UserUploadThresholdTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysUser = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BOT,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.USERNAME,
]);

export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: string | null = null;
  blocked: boolean = false;
  blockedReason: string | null = null;
  bot: boolean = false;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  username: string = '';

  constructor(data?: Structures.BaseStructureData) {
    super();
    if (data) {
      this.merge(data);
    }
  }

  get isPremium(): boolean {
    return this.hasOwner();
  }

  hasOwner(): boolean {
    return this.hasFlag(UserFlags.OWNER);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }
}


const keysUserFull = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BOT,
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.PREMIUM_TYPE,
  NotSoApiKeys.USERNAME,
]);

export class UserFull extends User {
  readonly _keys = keysUserFull;

  avatar: string | null = null;
  blocked: boolean = false;
  blockedReason: string | null = null;
  bot: boolean = false;
  channelId: string | null = null;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  premiumType: UserPremiumTypes = UserPremiumTypes.NONE;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get isPremium(): boolean {
    return !!this.premiumType || this.hasOwner();
  }
}
