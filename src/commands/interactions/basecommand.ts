import * as Sentry from '@sentry/node';

import { Collections, Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationCommandOptionTypes,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Components, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import GuildSettingsStore from '../../stores/guildsettings';
import ServerSettingsStore from '../../stores/serversettings';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import { createUserCommand } from '../../api';
import {
  CommandCategories,
  CommandTypes,
  DiscordSkuIds,
  GuildFeatures,
  UserFlags,
  UserPremiumTypes,
  UserSettingsApplicationCommandResponseTypes,
} from '../../constants';
import { DefaultParameters, I18n, Parameters, getCommandIdFromInvoker } from '../../utils';

import {
  createArgumentErrorPayload,
  createRunErrorPayload,
  formatPermissions,
  replyError,
  replyWarning as replyErrorWarning,
  warning,
} from '../errors';


export interface InteractionCommandMetadata {
  // optional: defaults to the prefixed command with the same id, then SLASH_COMMAND_CATEGORY_FALLBACKS
  category?: CommandCategories,
  id: string,
  nsfw?: boolean,
  premium?: boolean,
  premiumServer?: boolean,
};

// `error` is the english label ('Slash', 'User Context Menu') shown at the start of error messages
export function translateErrorLabel(error: string, translate: I18n.Translator['translate']): string {
  switch (error) {
    case 'Command': return translate('errors.label.command');
    case 'Message Context Menu': return translate('errors.label.message_context_menu');
    case 'Slash': return translate('errors.label.slash');
    case 'User Context Menu': return translate('errors.label.user_context_menu');
  }
  return error;
}


// interaction errors are always ephemeral
function replyWarning(context: Interaction.InteractionContext, content: string) {
  return replyErrorWarning(context, content, {ephemeral: true});
}


// shared by the url media options when no url was found, `notFound` is the error for an empty channel
async function replyMediaUrlNotFound(
  context: Interaction.InteractionContext,
  url: null | undefined,
  notFound: I18n.TranslationKey,
) {
  const { translate } = await I18n.getTranslator(context);
  if (url === null) {
    return replyWarning(context, translate('errors.invalid_user_or_url'));
  }
  if (!context.hasServerPermissions) {
    return replyWarning(context, translate('errors.no_channel_history'));
  }
  return replyWarning(context, translate(notFound));
}


export class BaseInteractionCommand extends Interaction.InteractionCommand {
  _commandIds?: Collections.BaseSet<string>;
  blockedCommandShouldStillExecute = true;
  error = 'Command';

  get commandIds() {
    if (!this._commandIds) {
      this._commandIds = new Collections.BaseSet<string>();
      for (let invoker of this.invokers) {
        const commandId = getCommandIdFromInvoker(invoker);
        this.commandIds.add(commandId);
      }
    }
    return this._commandIds;
  }

  onAutoCompleteError(context: Interaction.InteractionAutoCompleteContext, error: any) {
    Sentry.captureException(error);
  }

  onLoadingTrigger(context: Interaction.InteractionContext) {
    if (context.responded) {
      return;
    }

    const invoker = context.invoker as BaseInteractionCommand | BaseInteractionCommandOption;
    if (this.triggerLoadingAsEphemeral || invoker.triggerLoadingAsEphemeral) {
      return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
        flags: MessageFlags.EPHEMERAL,
      });
    }

    if (UserSettingsStore.has(context.userId)) {
      const settings = UserSettingsStore.get(context.userId)!;
      switch (settings.application_command_response_type) {
        case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
          return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
            flags: MessageFlags.EPHEMERAL,
          });
        };
      }
    }

    // check perms to maybe force as ephemeral, just in case
    return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  }

  async onDmBlocked(context: Interaction.InteractionContext) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.dm_blocked', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }

  onBefore(context: Interaction.InteractionContext): Promise<boolean> | boolean {
    return new Promise(async (resolve) => {
      if (!context.responded && UserSettingsStore.has(context.userId)) {
        const settings = UserSettingsStore.get(context.userId)!;
        switch (settings.application_command_response_type) {
          case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
            await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
              flags: MessageFlags.EPHEMERAL,
            });
          };
        }
      }

      const contextMetadata = context.metadata = context.metadata || {};
      const { translate } = await I18n.getTranslator(context);
  
      const metadata = context.invoker.metadata;
      if (metadata) {
        if (metadata.nsfw) {
          const isNSFWAllowed = !!(context.inDm || (context.channel && (context.channel.isDm || context.channel.nsfw)));
          if (!isNSFWAllowed) {
            contextMetadata.reason = warning(translate('errors.not_nsfw_channel'));
            return resolve(isNSFWAllowed);
          }
        }
        if (metadata.premium || metadata.premiumServer) {
          let hasPremium: boolean = false;
          const user = await UserStore.getOrFetch(context, context.userId);
          if (user && (user.premiumType || user.hasFlag(UserFlags.OWNER))) {
            hasPremium = true;
          }

          if (!hasPremium && metadata.premiumServer) {
            if (context.guildId) {
              const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
              if (settings && (typeof(metadata.premiumServer) === 'string' && settings.features.has(metadata.premiumServer))) {
                hasPremium = true;
              } else {
                const guild = context.guild;
                if (guild) {
                  const owner = await UserStore.getOrFetch(context, guild.ownerId);
                  if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
                    hasPremium = true;
                  }
                }
              }
            } else if (context.inDm && context.channel && context.channel.ownerId) {
              // most likely a group dm, check to see if is owner of it
              const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
              if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
                hasPremium = true;
              }
              if (!hasPremium && typeof(metadata.premiumServer) === 'string') {
                const serverId = context.channelId!;
                const settings = await ServerSettingsStore.getOrFetch(context, serverId);
                if (settings && settings.features.has(metadata.premiumServer)) {
                  hasPremium = true;
                }
              }
            }
          }

          if (!hasPremium) {
            context.metadata = context.metadata || {};
            if (metadata.premiumServer) {
              context.metadata.reason = warning(translate('errors.premium_server_required', {command: Markup.codestring(context.name)}));
            } else {
              context.metadata.reason = warning(translate('errors.premium_required', {command: Markup.codestring(context.name)}));
            }
            context.metadata.reasonIsPremiumRequired = true;
            return resolve(hasPremium);
          }
        }
      }
      return resolve(true);
    });
  }

  onCancel(context: Interaction.InteractionContext) {
    const contextMetadata = context.metadata = context.metadata || {};
    if (contextMetadata.reason) {
      if (contextMetadata.reasonIsPremiumRequired) {
        const storePageUrl = (
          Endpoints.Routes.URL +
          Endpoints.Routes.APPLICATION_DIRECTORY(context.applicationId) +
          `/${DiscordSkuIds.USER_NOTSOPREMIUM}`
        );

        contextMetadata.reason = [
          contextMetadata.reason,
          //`Buy it here: ${storePageUrl}`,
        ].join('\n').trim();

        /*
        components = new Components();
        components.createButton({
          skuId: DiscordSkuIds.USER_NOTSOPREMIUM,
          style: MessageComponentButtonStyles.PREMIUM,
        });
        */
      }
      return replyError(context, {description: contextMetadata.reason}, {ephemeral: true});
    }
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }

  async onPermissionsFailClient(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.bot_missing_permissions', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translator.translate),
      permissions: formatPermissions(failed, translator),
    }));
  }

  async onPermissionsFail(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.user_missing_permissions', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translator.translate),
      permissions: formatPermissions(failed, translator),
    }));
  }

  async onRunError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, error: any) {
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.run_title', {label: translateErrorLabel(this.error, translator.translate)}));
    await replyError(context, await createRunErrorPayload(context, title, error, translator), {ephemeral: true});
  }

  // log every attempt (ran, errored, cancelled, ratelimited, etc..)
  async onFinally(context: Interaction.InteractionContext) {
    if (!context.invoker || !context.invoker.metadata) {
      return;
    }

    let commandType: null | number = null;
    switch (context.command.type) {
      case ApplicationCommandTypes.CHAT_INPUT: commandType = CommandTypes.APPLICATION_SLASH; break;
      case ApplicationCommandTypes.MESSAGE: commandType = CommandTypes.APPLICATION_MENU_MESSAGE; break;
      case ApplicationCommandTypes.USER: commandType = CommandTypes.APPLICATION_MENU_USER; break;
      default: commandType = null;
    }

    if (commandType !== null) {
      const metadata = context.invoker.metadata;
      const commandId = metadata.id || context.name.split(' ').join('.');
      await createUserCommand(
        context,
        context.userId,
        commandId,
        {
          commandType,
          channelId: context.channelId!,
          guildId: context.guildId,
          messageResponseId: context.responseId,
          messageTriggerId: context.interactionId,
        },
      );
    }
  }

  async onValueError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, errors: Interaction.ParsedErrors) {
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.argument_title', {label: translateErrorLabel(this.error, translator.translate)}));
    return replyError(context, createArgumentErrorPayload(title, errors, translator), {ephemeral: true});
  }
}


export class BaseInteractionCommandOption extends Interaction.InteractionCommandOption {
  blockedCommandShouldStillExecute = true;
  error = 'Slash';
  triggerLoadingAsEphemeral = false;
  type = ApplicationCommandOptionTypes.SUB_COMMAND;

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }
}


// tags are stored per server, so only let them be written in servers that installed the bot (not through a user install)
export function canWriteServerTags(context: Interaction.InteractionContext): boolean {
  return !context.guildId || context.hasServerPermissions;
}

export class BaseInteractionTagWriteCommandOption extends BaseInteractionCommandOption {
  onBefore(context: Interaction.InteractionContext): Promise<boolean> | boolean {
    return canWriteServerTags(context);
  }

  async onCancel(context: Interaction.InteractionContext) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('tag.server_not_installed'));
  }
}


export class BaseInteractionAudioOrVideoCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), label: 'url', default: DefaultParameters.lastMediaUrl({image: false}), value: Parameters.lastMediaUrl({image: false})},
        {name: 'attachment', description: 'Audio/Video File', ...I18n.optionLocalizations('commands.options.audio_video.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_audio_video_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionImageCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ...data,
      options: [
        ...(data.options || []),
        {
          name: 'url',
          description: 'Emoji/Image URL/User',
          ...I18n.optionLocalizations('commands.options.image.url'),
          default: DefaultParameters.lastMediaUrl({audio: false, video: false}),
          value: Parameters.lastMediaUrl({audio: false, video: false}),
        },
        {
          name: 'attachment',
          description: 'Image File',
          ...I18n.optionLocalizations('commands.options.image.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_images_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionImageOrVideoCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl({audio: false}), value: Parameters.lastMediaUrl({audio: false})},
        {name: 'attachment', description: 'Media File', ...I18n.optionLocalizations('commands.options.media.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_images_videos_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionMediaCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl(), value: Parameters.lastMediaUrl()},
        {name: 'attachment', description: 'Media File', ...I18n.optionLocalizations('commands.options.media.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_media_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionMediasCommandOption extends BaseInteractionCommandOption {
  maxAmount = 2;
  minAmount = 0;

  constructor(data: Partial<Interaction.InteractionCommandOptionOptions> & {maxAmount?: number, minAmount?: number}) {
    const mediaUrls = Parameters.mediaUrls({
      maxAmount: data.maxAmount,
      minAmount: data.minAmount,
    });

    // numbered attachments, so the localized names get the number too (`archivo-1`)
    const { nameLocalizations, ...attachmentLocalizations } = I18n.optionLocalizations('commands.options.media.attachment');
    const attachmentOptions = Array.from({length: data.maxAmount || 2}).map((x, key) => {
      return {
        name: `attachment-${key + 1}`,
        ...(nameLocalizations) ? {
          nameLocalizations: Object.fromEntries(Object.entries(nameLocalizations).map(([locale, name]) => [locale, `${name}-${key + 1}`])),
        } : {},
        description: 'Media File',
        ...attachmentLocalizations,
        type: ApplicationCommandOptionTypes.ATTACHMENT,
      };
    });

    super({
      ...data,
      options: [
        ...(data.options || []),
        {
          name: 'urls',
          description: 'Emoji/Media URLs/Users',
          ...I18n.optionLocalizations('commands.options.medias.urls'),
          default: (context: Interaction.InteractionContext) => mediaUrls('', context),
          value: mediaUrls,
        },
        ...attachmentOptions,
      ],
    });

    this.maxAmount = data.maxAmount || this.maxAmount;
    this.minAmount = data.minAmount || this.minAmount;
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {urls: Array<string>}) {
    return !!args.urls.length && args.urls.length <= this.maxAmount && this.minAmount <= args.urls.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: {urls: Array<string>}) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.urls.length) {
      if (!context.hasServerPermissions) {
        return replyWarning(context, translate('errors.no_channel_history'));
      }
      return replyWarning(context, translate('errors.no_media_found'));
    } else if (args.urls.length < this.minAmount) {
      if (!context.hasServerPermissions) {
        return replyWarning(context, translate('errors.no_channel_history_amount', {amount: this.minAmount}));
      }
      return replyWarning(context, translate('errors.not_enough_media_found', {amount: this.minAmount}));
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return replyWarning(context, translate('errors.too_many_media_found'));
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionVideoCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl({audio: false, image: false}), value: Parameters.lastMediaUrl({audio: false, image: false})},
        {name: 'attachment', description: 'Video File', ...I18n.optionLocalizations('commands.options.video.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_videos_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionCommandOptionGroup extends Interaction.InteractionCommandOption {
  error = 'Slash';
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }
}



export class BaseSlashCommand extends BaseInteractionCommand {
  error = 'Slash';
  permissionsIgnoreClientOwner = true;
  type = ApplicationCommandTypes.CHAT_INPUT;

  triggerLoadingAfter = 1000;
}


export interface ContextMenuMessageArgs {
  message: Structures.Message,
}

export class BaseContextMenuMessageCommand extends BaseInteractionCommand {
  error = 'Message Context Menu';
  type = ApplicationCommandTypes.MESSAGE;

  global = true;
  permissionsIgnoreClientOwner = true;
  triggerLoadingAfter = 1000;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(Object.assign({guildIds: ['178313653177548800', '621077547471601685']}, data));
  }
}


export interface ContextMenuUserArgs {
  member?: Structures.Member,
  user: Structures.User,
}

export class BaseContextMenuUserCommand extends BaseInteractionCommand {
  error = 'User Context Menu';
  type = ApplicationCommandTypes.USER;

  global = true;
  permissionsIgnoreClientOwner = true;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(Object.assign({guildIds: ['178313653177548800']}, data));
  }
}
