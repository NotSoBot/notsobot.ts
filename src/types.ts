import { RestResponsesRaw } from './api/types';


export namespace RedisPayloads {
  export interface GuildFeaturesUpdate {
    features: Array<string>,
    id: string,
  }

  export interface GuildLoggerUpdate {
    id: string,
    loggers: Array<RestResponsesRaw.GuildLogger>,
  }

  export interface GuildPrefixUpdate {
    id: string,
    prefixes: Array<RestResponsesRaw.GuildPrefix>,
  }

  // a report resolved, dismissed or reopened from the dashboard, its messages in the reports loggers get redrawn. `created`
  // is unix ms, `moderator_id` is the dashboard user
  export interface GuildReportMessageCreate {
    log_messages: Array<RestResponsesRaw.GuildReportLogMessage>,
    message: RestResponsesRaw.GuildReportMessage,
    report: RestResponsesRaw.GuildReport,
  }

  export interface GuildReportUpdate {
    created: number,
    log_messages: Array<RestResponsesRaw.GuildReportLogMessage>,
    moderator_id: string,
    report: RestResponsesRaw.GuildReport,
  }

  export interface GuildRulesUpdate {
    id: string,
    rules: Array<RestResponsesRaw.GuildRule>,
  }

  export type GuildSettingsUpdate = RestResponsesRaw.GuildSettings;

  // warnings removed from the dashboard, for the server's moderation loggers. `created` is unix ms, `moderator_id` is
  // the dashboard user
  export interface GuildWarningDelete {
    created: number,
    moderator_id: string,
    warning: RestResponsesRaw.GuildWarning,
  }

  export interface GuildWarningDeleteBulk {
    created: number,
    // how many each user had, only the ones that had any
    deleted: Record<string, number>,
    guild_id: string,
    moderator_id: string,
  }

  export interface InfoDiscordRequest {
    
  }

  // the dashboard's music controls, for whichever cluster is playing in `guild_id`. `created` is unix ms, events are
  // replayed after reconnecting so old ones are ignored
  export interface MusicControl {
    action: 'effect_add' | 'effect_clear' | 'effect_remove' | 'leave' | 'pause' | 'resume' | 'skip' | 'speed' | 'volume',
    created: number,
    // `effect_add` and `effect_remove`, a `MusicEffects` value (the api only checks it looks like one)
    effect?: string,
    guild_id: string,
    // `effect_remove`, where in the stack the dashboard saw it
    index?: number,
    user_id: string,
    // `speed` (the tempo) and `volume`, percent. The api saved it for the server already (and checked premium)
    value?: number,
  }

  export type ReminderCreate = RestResponsesRaw.Reminder;
  export type ReminderDelete = RestResponsesRaw.Reminder;
  export type ReminderUpdate = RestResponsesRaw.Reminder;

  // also sent when banning someone again replaces their timed ban (a delete for the old one comes first)
  export type TimedBanCreate = RestResponsesRaw.TimedBan;
  export type TimedBanDelete = RestResponsesRaw.TimedBan;

  // a staff reply on a report, to DM the reporter (the dashboard's shape, staff are NotSoAdmin)
  export interface ReportMessageCreate {
    // the reporter's saved DM channel with us, null if we never saw it
    channel_id: null | string,
    message: RestResponsesRaw.ReportMessage,
    report: Omit<RestResponsesRaw.Report, 'notes' | 'reviewed_by' | 'user'>,
    user_id: string,
  }

  export interface PremiumServersUpdate {
    server_id: string,
    // everyone that gave the server a slot, premium plus or not
    user_ids: Array<string>,
  }

  export interface ServerFeaturesUpdate {
    features: Array<string>,
    id: string,
  }

  export type ServerSettingsUpdate = RestResponsesRaw.ServerSettings;

  export type TagDelete = RestResponsesRaw.Tag;

  export interface TagDeleteBulk {
    dm_user_id: string | null,
    tag_ids: Array<string>,
    server_id: string,
  }

  export type TagUpdate = RestResponsesRaw.Tag;

  export interface UserSettingsUpdate {
    id: string,
    settings: RestResponsesRaw.UserSettings,
  }

  export type UserUpdate = RestResponsesRaw.User;
}
