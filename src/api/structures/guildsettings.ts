import * as moment from 'moment';

import { Collections, ShardClient, Structures } from 'detritus-client';
import { DiscordAbortCodes } from 'detritus-client/lib/constants';
import { RequestTypes } from 'detritus-client-rest';

import { deleteGuildDisabledCommand, deleteGuildLogger } from '../../api';
import {
  EmbedBrands,
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildDisableCommandsTypes,
  GuildLoggerFlags,
  GuildLoggerTypes,
  GuildPremiumTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysGuildSettings = new Collections.BaseSet<string>([
  NotSoApiKeys.ALLOWLIST,
  NotSoApiKeys.BLOCKLIST,
  NotSoApiKeys.DISABLED_COMMANDS,
  NotSoApiKeys.DISABLED_LOGGER_EVENTS,
  NotSoApiKeys.ICON,
  NotSoApiKeys.ID,
  NotSoApiKeys.LOGGER_FLAGS,
  NotSoApiKeys.LOGGERS,
  NotSoApiKeys.NAME,
  NotSoApiKeys.PREFIXES,
  NotSoApiKeys.PREMIUM_TYPE,
]);

export class GuildSettings extends BaseStructure {
  readonly _keys = keysGuildSettings;
  _allowlist?: Collections.BaseCollection<string, GuildSettingsAllowlist>;
  _blocklist?: Collections.BaseCollection<string, GuildSettingsBlocklist>;
  _disabledCommands?: Collections.BaseCollection<string, GuildSettingsDisabledCommand>;
  _loggers?: Collections.BaseCollection<string, GuildSettingsLogger>;
  _prefixes?: Collections.BaseCollection<string, GuildSettingsPrefix>;

  disabledLoggerEvents: number = 0;
  icon: string | null = null;
  id: string = '';
  name: string = '';
  premiumType: GuildPremiumTypes = GuildPremiumTypes.NONE;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get allowlist(): Collections.BaseCollection<string, GuildSettingsAllowlist> {
    if (this._allowlist) {
      return this._allowlist;
    }
    return Collections.emptyBaseCollection;
  }

  get blocklist(): Collections.BaseCollection<string, GuildSettingsBlocklist> {
    if (this._blocklist) {
      return this._blocklist;
    }
    return Collections.emptyBaseCollection;
  }

  get disabledCommands(): Collections.BaseCollection<string, GuildSettingsDisabledCommand> {
    if (this._disabledCommands) {
      return this._disabledCommands;
    }
    return Collections.emptyBaseCollection;
  }

  get loggers(): Collections.BaseCollection<string, GuildSettingsLogger> {
    if (this._loggers) {
      return this._loggers;
    }
    return Collections.emptyBaseCollection;
  }

  get prefixes(): Collections.BaseCollection<string, GuildSettingsPrefix> {
    if (this._prefixes) {
      return this._prefixes;
    }
    return Collections.emptyBaseCollection;
  }

  get shouldLogGuildMemberAdd(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_ADD);
  }

  get shouldLogGuildMemberRemove(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_REMOVE);
  }

  get shouldLogGuildMemberUpdate(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_UPDATE);
  }

  get shouldLogUserUpdate(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.USER_UPDATE);
  }

  get shouldLogMessageCreate(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_CREATE);
  }

  get shouldLogMessageDelete(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_DELETE);
  }

  get shouldLogMessageUpdate(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_UPDATE);
  }

  get shouldLogVoiceChannelConnection(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_CONNECTION);
  }

  get shouldLogVoiceChannelModify(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_MODIFY);
  }

  get shouldLogVoiceChannelMove(): boolean {
    return !this.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_MOVE);
  }

  hasDisabledLoggerEventFlag(flag: number): boolean {
    return (this.disabledLoggerEvents & flag) === flag;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.ALLOWLIST: {
          if (value.length) {
            if (!this._allowlist) {
              this._allowlist = new Collections.BaseCollection<string, GuildSettingsAllowlist>();
            }
            this._allowlist.clear();
            for (let raw of value) {
              const item = new GuildSettingsAllowlist(raw);
              this._allowlist.set(item.key, item);
            }
          } else {
            if (this._allowlist) {
              this._allowlist.clear();
              this._allowlist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.BLOCKLIST: {
          if (value.length) {
            if (!this._blocklist) {
              this._blocklist = new Collections.BaseCollection<string, GuildSettingsBlocklist>();
            }
            this._blocklist.clear();
            for (let raw of value) {
              const item = new GuildSettingsBlocklist(raw);
              this._blocklist.set(item.key, item);
            }
          } else {
            if (this._blocklist) {
              this._blocklist.clear();
              this._blocklist = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.DISABLED_COMMANDS: {
          if (value.length) {
            if (!this._disabledCommands) {
              this._disabledCommands = new Collections.BaseCollection<string, GuildSettingsDisabledCommand>();
            }
            this._disabledCommands.clear();
            for (let raw of value) {
              const item = new GuildSettingsDisabledCommand(raw);
              this._disabledCommands.set(item.key, item);
            }
          } else {
            if (this._disabledCommands) {
              this._disabledCommands.clear();
              this._disabledCommands = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.LOGGERS: {
          if (value.length) {
            if (!this._loggers) {
              this._loggers = new Collections.BaseCollection<string, GuildSettingsLogger>();
            }
            this._loggers.clear();
            for (let raw of value) {
              const item = new GuildSettingsLogger(raw);
              this._loggers.set(item.key, item);
            }
          } else {
            if (this._loggers) {
              this._loggers.clear();
              this._loggers = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.PREFIXES: {
          if (value.length) {
            if (!this._prefixes) {
              this._prefixes = new Collections.BaseCollection<string, GuildSettingsPrefix>();
            }
            this._prefixes.clear();
            for (let raw of value) {
              const item = new GuildSettingsPrefix(raw);
              this._prefixes.set(item.prefix, item);
            }
          } else {
            if (this._prefixes) {
              this._prefixes.clear();
              this._prefixes = undefined;
            }
          }
        }; return;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysGuildSettingsAllowlistAndBlocklist = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsAllowlist extends BaseStructure {
  readonly _keys = keysGuildSettingsAllowlistAndBlocklist;

  added: string = '';
  id: string = '';
  type!: GuildAllowlistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.id}.${this.type}`;
  }
}


export class GuildSettingsBlocklist extends BaseStructure {
  readonly _keys = keysGuildSettingsAllowlistAndBlocklist;

  added: string = '';
  id: string = '';
  type!: GuildBlocklistTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.id}.${this.type}`;
  }
}


const keysGuildSettingsDisabledCommand = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.COMMAND,
  NotSoApiKeys.ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsDisabledCommand extends BaseStructure {
  readonly _keys = keysGuildSettingsDisabledCommand;

  added: string = '';
  command: string = '';
  id: string = '';
  type!: GuildDisableCommandsTypes;
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.command}.${this.id}.${this.type}`;
  }

  /*
  async delete(shard: ShardClient) {
    return deleteGuildDisabledCommand({client: shard}, this.guildId, {
      channelId: this.channelId,
      loggerType: this.type,
    });
  }
  */
}


const keysGuildSettingsLogger = new Collections.BaseSet<string>([
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.GUILD_ID,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.WEBHOOK_ID,
  NotSoApiKeys.WEBHOOK_TOKEN,
]);

export class GuildSettingsLogger extends BaseStructure {
  readonly _keys = keysGuildSettingsLogger;

  channelId: string = '';
  disabledEvents: number = 0;
  guildId: string = '';
  type!: GuildLoggerTypes;
  webhookId?: string;
  webhookToken?: string;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get key(): string {
    return `${this.type}.${this.channelId}`;
  }

  hasDisabledEventFlag(flag: number): boolean {
    return (this.disabledEvents & flag) === flag;
  }

  get isGuildMemberType(): boolean {
    return this.type === GuildLoggerTypes.GUILD_MEMBERS;
  }

  get isMessageType(): boolean {
    return this.type === GuildLoggerTypes.MESSAGES;
  }

  get isUserType(): boolean {
    return this.type === GuildLoggerTypes.USERS;
  }

  get isVoiceType(): boolean {
    return this.type === GuildLoggerTypes.VOICE;
  }

  async delete(shard: ShardClient) {
    return deleteGuildLogger({client: shard}, this.guildId, {
      channelId: this.channelId,
      loggerType: this.type,
    });
  }

  async execute(
    shard: ShardClient,
    options: RequestTypes.ExecuteWebhook | string = {},
    compatibleType?: string,
  ) {
    if (!this.webhookId || !this.webhookToken) {
      throw new Error('Webhook ID or Webhook Token missing');
    }
    // add checks that if this fails because it got deleted, delete it from the server
    options = Object.assign({
      avatarUrl: EmbedBrands.NOTSOBOT,
      username: 'NotSoBot',
    }, options);
    try {
      return await shard.rest.executeWebhook(this.webhookId, this.webhookToken, options, compatibleType);
    } catch(error) {
      switch (error.code) {
        case DiscordAbortCodes.INVALID_WEBHOOK_TOKEN:
        case DiscordAbortCodes.UNKNOWN_WEBHOOK: {
          return this.delete(shard);
        };
        default: {
          throw error;
        };
      }
    }
  }
}


const keysGuildSettingsPrefix = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.GUILD_ID,
  NotSoApiKeys.PREFIX,
  NotSoApiKeys.USER_ID,
]);

export class GuildSettingsPrefix extends BaseStructure {
  readonly _keys = keysGuildSettingsPrefix;

  added: string = '';
  guildId: string = '';
  prefix: string = '';
  userId: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }
}
