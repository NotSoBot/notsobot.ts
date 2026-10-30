import { Collections, Structures } from 'detritus-client';

import {
  UserFlags,
  UserPremiumTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


export interface UserWarningPending {
  // made by blocking them, shown once a timed block lifts
  block: boolean,
  created: string,
  id: string,
  // only a block's can be empty
  reason: string | null,
}


export function isBlockExpired(blockedUntil: string | null): boolean {
  return !!blockedUntil && Date.parse(blockedUntil) <= Date.now();
}


const keysUser = new Collections.BaseSet<string>([
  NotSoApiKeys.AVATAR,
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BLOCKED_UNTIL,
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
  blockedUntil: string | null = null;
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

  // a timed block is over once its time passes, even before the api's cleaner lifts it (it runs every minute)
  get isBlocked(): boolean {
    return this.blocked && !isBlockExpired(this.blockedUntil);
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
  NotSoApiKeys.BLOCKED_UNTIL,
  NotSoApiKeys.BOT,
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.DISCRIMINATOR,
  NotSoApiKeys.FLAGS,
  NotSoApiKeys.ID,
  NotSoApiKeys.PREMIUM_TYPE,
  NotSoApiKeys.USERNAME,
  NotSoApiKeys.WARNINGS_PENDING,
]);

export class UserFull extends User {
  readonly _keys = keysUserFull;

  avatar: string | null = null;
  blocked: boolean = false;
  blockedReason: string | null = null;
  blockedUntil: string | null = null;
  bot: boolean = false;
  channelId: string | null = null;
  discriminator: string = '0000';
  flags: number = 0;
  id: string = '';
  premiumType: UserPremiumTypes = UserPremiumTypes.NONE;
  // warnings from NotSoBot staff they haven't seen yet, shown in place of their next command
  warningsPending: Array<UserWarningPending> = [];

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get isPremium(): boolean {
    return this.premiumType === UserPremiumTypes.PREMIUM || this.isPremiumPlus;
  }

  // PLUS_AI is the tier above PLUS and includes it, same as the api's `has_premium_plus`
  get isPremiumPlus(): boolean {
    return (
      (this.premiumType === UserPremiumTypes.PREMIUM_FREE) ||
      (this.premiumType === UserPremiumTypes.PREMIUM_PLUS) ||
      (this.premiumType === UserPremiumTypes.PREMIUM_PLUS_AI) ||
      this.hasOwner()
    );
  }

  get isPremiumPlusAI(): boolean {
    return (
      (this.premiumType === UserPremiumTypes.PREMIUM_FREE) ||
      (this.premiumType === UserPremiumTypes.PREMIUM_PLUS_AI) ||
      this.hasOwner()
    );
  }
}
