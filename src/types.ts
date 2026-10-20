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

  export interface GuildRulesUpdate {
    id: string,
    rules: Array<RestResponsesRaw.GuildRule>,
  }

  export type GuildSettingsUpdate = RestResponsesRaw.GuildSettings;

  export interface InfoDiscordRequest {
    
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
    message: {
      author: 'reporter' | 'staff',
      content: null | string,
      created: string,
      id: string,
      status: null | number,
    },
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
