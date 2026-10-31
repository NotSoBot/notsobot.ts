import moment from 'moment';

import { Collections, ShardClient, Structures } from 'detritus-client';

import { deleteGuildLogger } from '../../api';
import {
  BAN_CLEAN_DEFAULT,
  GuildLoggerFlags,
  GuildLoggerTypes,
  GuildRuleActions,
  GuildRuleTargetTypes,
  GuildSettingsResponseDisplayTypes,
  NotSoApiKeys,
  UserSettingsSearchProviders,
  WARNINGS_WINDOW_DEFAULT,
} from '../../constants';

import { RestResponsesRaw } from '../types';

import { BaseStructure } from './basestructure';
import { isBlockExpired } from './user';


const keysGuildSettings = new Collections.BaseSet<string>([
  NotSoApiKeys.BLOCKED,
  NotSoApiKeys.BLOCKED_REASON,
  NotSoApiKeys.BLOCKED_UNTIL,
  NotSoApiKeys.DISABLED_LOGGER_EVENTS,
  NotSoApiKeys.FEATURES,
  NotSoApiKeys.ICON,
  NotSoApiKeys.ID,
  NotSoApiKeys.LOCALE,
  NotSoApiKeys.LOGGER_FLAGS,
  NotSoApiKeys.LOGGERS,
  NotSoApiKeys.NAME,
  NotSoApiKeys.PREFIXES,
  NotSoApiKeys.RULES,
  NotSoApiKeys.SETTINGS,
  NotSoApiKeys.TIMEZONE,
]);

export class GuildSettings extends BaseStructure {
  readonly _keys = keysGuildSettings;
  _loggers?: Collections.BaseCollection<string, GuildSettingsLogger>;
  _prefixes?: Collections.BaseCollection<string, GuildSettingsPrefix>;
  _rules?: Collections.BaseCollection<string, GuildSettingsRule>;

  blocked: boolean = false;
  blockedReason: string | null = null;
  blockedUntil: string | null = null;
  disabledLoggerEvents: number = 0;
  features = new Collections.BaseSet<string>();
  icon: string | null = null;
  id: string = '';
  locale: string | null = null;
  name: string = '';
  settings!: GuildSettingsChild;
  timezone: string | null = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  // like `User.isBlocked`, a timed block is over once its time passes
  get isBlocked(): boolean {
    return this.blocked && !isBlockExpired(this.blockedUntil);
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

  get rules(): Collections.BaseCollection<string, GuildSettingsRule> {
    if (this._rules) {
      return this._rules;
    }
    return Collections.emptyBaseCollection;
  }

  // if the server owner and admins skip this rule, rules without their own setting follow the server's
  canAdminBypass(rule: GuildSettingsRule): boolean {
    if (typeof(rule.adminBypass) === 'boolean') {
      return rule.adminBypass;
    }
    return (this.settings) ? this.settings.rulesAdminBypass : true;
  }

  // if the owner and admins skip every rule (the default)
  get adminBypassesEverything(): boolean {
    return this.rules.every((rule) => this.canAdminBypass(rule));
  }

  hasFeature(feature: string): boolean {
    if (this.features) {
      return this.features.has(feature);
    }
    return false;
  }

  hasDisabledLoggerEventFlag(flag: number): boolean {
    return (this.disabledLoggerEvents & flag) === flag;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.FEATURES: {
          if (this.features) {
            this.features.clear();
            for (let raw of value) {
              this.features.add(raw);
            }
          } else {
            this.features = new Collections.BaseSet<string>(value);
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
        case NotSoApiKeys.RULES: {
          if (value.length) {
            if (!this._rules) {
              this._rules = new Collections.BaseCollection<string, GuildSettingsRule>();
            }
            this._rules.clear();
            for (let raw of value) {
              const rule = new GuildSettingsRule(raw);
              this._rules.set(rule.id, rule);
            }
          } else {
            if (this._rules) {
              this._rules.clear();
              this._rules = undefined;
            }
          }
        }; return;
        case NotSoApiKeys.SETTINGS: {
          value = new GuildSettingsChild(value);
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysGuildSettingsRule = new Collections.BaseSet<string>([
  NotSoApiKeys.ACTION,
  NotSoApiKeys.ADDED,
  NotSoApiKeys.ADMIN_BYPASS,
  NotSoApiKeys.CATEGORY,
  NotSoApiKeys.COMMAND,
  NotSoApiKeys.ID,
  NotSoApiKeys.TARGET_ID,
  NotSoApiKeys.TARGET_TYPE,
  NotSoApiKeys.USER_ID,
  NotSoApiKeys.VALUE,
]);

export interface GuildSettingsRuleAccessValue {
  allow: boolean,
  // shown to whoever a block rule stops
  message: string | null,
}

// who can use what, see `resolveGuildRule` for how they're matched
export class GuildSettingsRule extends BaseStructure {
  readonly _keys = keysGuildSettingsRule;

  action!: GuildRuleActions;
  added: string = '';
  // null follows the server's setting
  adminBypass: boolean | null = null;
  // what it covers, a command, a command category or (both null) everything
  category: string | null = null;
  command: string | null = null;
  id: string = '';
  targetId: string = '';
  targetType!: GuildRuleTargetTypes;
  userId: string | null = null;
  value: GuildSettingsRuleAccessValue = {allow: true, message: null};

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get allows(): boolean {
    return !!this.value.allow;
  }

  get coversEverything(): boolean {
    return !this.command && !this.category;
  }

  // the rule's what/who, the api keeps one rule per action for each
  get key(): string {
    return `${this.action}.${this.targetType}.${this.targetId}.${this.command || ''}.${this.category || ''}`;
  }

  mergeValue(key: string, value: any): void {
    if (key === NotSoApiKeys.VALUE && value) {
      value = {allow: !!value.allow, message: value.message || null};
    }
    return super.mergeValue(key, value);
  }
}


const keysGuildSettingsLogger = new Collections.BaseSet<string>([
  NotSoApiKeys.ADDED,
  NotSoApiKeys.CHANNEL_ID,
  NotSoApiKeys.DISABLED_EVENTS,
  NotSoApiKeys.GUILD_ID,
  NotSoApiKeys.IGNORED_IDS,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.USER_ID,
  NotSoApiKeys.WEBHOOK_ID,
  NotSoApiKeys.WEBHOOK_TOKEN,
]);

export class GuildSettingsLogger extends BaseStructure {
  readonly _keys = keysGuildSettingsLogger;

  added: string = '';
  channelId: string = '';
  disabledEvents: number = 0;
  guildId: string = '';
  // channel ids (a category covers its channels, a channel its threads) or role ids, see `GUILD_LOGGER_IGNORE_TYPES`
  ignoredIds: Array<string> = [];
  type!: GuildLoggerTypes;
  userId: string = '';
  webhookId?: string;
  webhookToken?: string;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get addedAtText(): string {
    return moment(this.added).fromNow();
  }

  get key(): string {
    return `${this.type}.${this.channelId}`;
  }

  hasDisabledEventFlag(flag: number): boolean {
    return (this.disabledEvents & flag) === flag;
  }

  // sending through the webhook is `GuildLoggingListener.execute`, so `refresh -listeners` reloads it
  async delete(shard: ShardClient) {
    return deleteGuildLogger({client: shard}, this.guildId, {
      channelId: this.channelId,
      type: this.type,
    });
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


const keysGuildSettingsChild = new Collections.BaseSet<string>([
  NotSoApiKeys.BAN_CLEAN,
  NotSoApiKeys.ML_DIFFUSION_MODEL,
  NotSoApiKeys.ML_LLM_MODEL,
  NotSoApiKeys.ML_LLM_PERSONALITY,
  NotSoApiKeys.MODERATION_DM_DISABLED,
  NotSoApiKeys.MUSIC_DJ_ROLE_ID,
  NotSoApiKeys.RESPONSE_DISPLAY,
  NotSoApiKeys.RULES_ADMIN_BYPASS,
  NotSoApiKeys.SEARCH_PROVIDER_IMAGES,
  NotSoApiKeys.SEARCH_PROVIDER_WEB,
  NotSoApiKeys.WARNINGS_ACTIONS,
  NotSoApiKeys.WARNINGS_AUTO,
  NotSoApiKeys.WARNINGS_AUTO_EXEMPT,
  NotSoApiKeys.WARNINGS_EXPIRE,
  NotSoApiKeys.WARNINGS_WINDOW,
]);

export class GuildSettingsChild extends BaseStructure {
  readonly _keys = keysGuildSettingsChild;

  // seconds of a member's messages `ban` deletes when the moderator doesn't pick (0: none)
  banClean: number = BAN_CLEAN_DEFAULT;
  mlDiffusionModel: null | string = null;
  mlLLMModel: null | string = null;
  mlLLMPersonality: null | string = null;
  // the `GuildModerationDmFlags` members don't get dm'd about, 0: all of them
  moderationDmDisabled: number = 0;
  // the role that makes someone a music dj (with manage server), null falls back to roles named "notsomusic"
  musicDjRoleId: null | string = null;
  // null uses each user's preference, then our latest format
  responseDisplay: GuildSettingsResponseDisplayTypes | null = null;
  // if the server owner and admins skip the rules, rules can override it with their own `adminBypass`
  rulesAdminBypass: boolean = true;
  // null uses each user's preference, then our defaults
  searchProviderImages: UserSettingsSearchProviders | null = null;
  searchProviderWeb: UserSettingsSearchProviders | null = null;
  // the warning ladder, sorted by threshold, empty: off
  warningsActions: Array<RestResponsesRaw.GuildWarningAction> = [];
  // the auto-warn rules, by trigger with the anywhere ones first, empty: off
  warningsAuto: Array<RestResponsesRaw.GuildWarningAuto> = [];
  // who every auto-warn rule skips, null: nobody
  warningsAutoExempt: RestResponsesRaw.GuildWarningAutoExempt | null = null;
  // seconds until a warning gets deleted, null: never
  warningsExpire: null | number = null;
  // seconds a warning counts towards a member's active warnings
  warningsWindow: number = WARNINGS_WINDOW_DEFAULT;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }
}
