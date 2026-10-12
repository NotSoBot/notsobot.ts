import * as Sentry from '@sentry/node';

import { Collections, Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationCommandOptionTypes,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Components, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Response } from 'detritus-rest';

import GuildSettingsStore from '../../stores/guildsettings';
import ServerSettingsStore from '../../stores/serversettings';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import { createUserCommand } from '../../api';
import {
  CommandTypes,
  DiscordSkuIds,
  EmbedColors,
  GuildFeatures,
  PermissionsText,
  StatusEmojis,
  UserFlags,
  UserPremiumTypes,
  UserSettingsApplicationCommandResponseTypes,
} from '../../constants';
import { DefaultParameters, I18n, Parameters, editOrReply, getCommandIdFromInvoker } from '../../utils';


export interface InteractionCommandMetadata {
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

    if (this.triggerLoadingAsEphemeral) {
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
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.dm_blocked', {command: `\`${command}\``, label: translateErrorLabel(this.error, translate)})}`,
      flags: MessageFlags.EPHEMERAL,
    });
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
            contextMetadata.reason = `${StatusEmojis.WARNING} ${translate('errors.not_nsfw_channel')}`;
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
              context.metadata.reason = translate('errors.premium_server_required', {command: Markup.codestring(context.name)});
            } else {
              context.metadata.reason = translate('errors.premium_required', {command: Markup.codestring(context.name)});
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
      return editOrReply(context, {
        content: contextMetadata.reason,
        flags: MessageFlags.EPHEMERAL,
      });
    }
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.cancel_run', {command: `\`${command}\``, label: translateErrorLabel(this.error, translate)})}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async onPermissionsFailClient(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const { translate } = await I18n.getTranslator(context);
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(${translate('common.unknown_value', {value: String(permission)})})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.bot_missing_permissions', {command, label: translateErrorLabel(this.error, translate), permissions: permissions.join(', ')})}`,
    });
  }

  async onPermissionsFail(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const { translate } = await I18n.getTranslator(context);
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(${translate('common.unknown_value', {value: String(permission)})})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.user_missing_permissions', {command, label: translateErrorLabel(this.error, translate), permissions: permissions.join(', ')})}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async onRunError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, error: any) {
    const { translate } = await I18n.getTranslator(context);
    const embed = new Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${StatusEmojis.WARNING} ${translate('errors.run_title', {label: translateErrorLabel(this.error, translate)})}`);

    const description: Array<string> = [];
    if (error.response) {
      const response: Response = error.response;
      try {
        const information = await response.json() as any;
        description.push(error.message || error.stack);
        if ('errors' in information) {
          for (let key in information.errors) {
            const value = information.errors[key];
            let message: string;
            if (typeof(value) === 'object') {
              message = JSON.stringify(value);
            } else {
              message = String(value);
            }
            description.push(`**${key}**: ${message}`);
          }
        }

        if (
          response.statusCode === 429 &&
          (
            (context.rest.raw.restClient.baseUrl instanceof URL) &&
            (context.rest.raw.restClient.baseUrl.host === response.request.parsedUrl.host)
          )
        ) {
          const headers: Record<string, string> = {};
          for (let [header, value] of response.headers) {
            if (header.startsWith('x-ratelimit')) {
              headers[header] = value;
            }
          }
          embed.addField('Ratelimit Info', [
            '```json',
            JSON.stringify({body: information, headers}),
            '```',
          ].join('\n'));
        }

      } catch(e) {
        if (response.statusCode === 502 || response.statusCode === 521) {
          description.push(translate('errors.api_restarting'));
        } else {
          description.push(translate('errors.http_exception', {status: response.statusCode}));
          const contentType = response.headers.get('content-type') || '';
          if (contentType.startsWith('text/html')) {
            // parse it?
          } else {
            description.push(translate('errors.unknown_error_data'));
            if (contentType) {
              description.push(`**Mimetype**: ${contentType}`);
            }
          }
        }
      }
    } else {
      const message = String(error.message || error.stack);
      if (message.includes('reason: connect ECONNREFUSED 127.0.0.1:80')) {
        description.push(translate('errors.api_restarting'));
      } else {
        description.push(message);
      }
    }

    let file: any = undefined;
    if (4096 < description.length) {
      embed.setDescription(translate('errors.uploaded'));
      file = {filename: 'error.txt', value: description.join('\n')};
    } else {
      embed.setDescription(description.join('\n'));
    }

    if (error.metadata) {
      embed.addField('Metadata', [
        '```json',
        JSON.stringify(error.metadata),
        '```',
      ].join('\n'));
    }

    await context.editOrRespond({
      embed,
      file,
      flags: MessageFlags.EPHEMERAL,
    });

    if (context.invoker && context.invoker.metadata) {
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
  }

  async onSuccess(context: Interaction.InteractionContext, args: Interaction.ParsedArgs) {
    // log usage
    if (context.invoker && context.invoker.metadata) {
      let commandType: null | number = null;
      switch (context.command.type) {
        case ApplicationCommandTypes.CHAT_INPUT: commandType = CommandTypes.APPLICATION_SLASH; break;
        case ApplicationCommandTypes.MESSAGE: commandType = CommandTypes.APPLICATION_MENU_MESSAGE; break;
        case ApplicationCommandTypes.USER: commandType = CommandTypes.APPLICATION_MENU_USER; break;
        default: commandType = null;
      }

      if (commandType !== null) {
        const metadata = context.invoker.metadata;
        const commandId = metadata.id || context.name.split(' ').join('.')
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
  }

  async onValueError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, errors: Interaction.ParsedErrors) {
    const { translate } = await I18n.getTranslator(context);
    const embed = new Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${StatusEmojis.WARNING} ${translate('errors.argument_title', {label: translateErrorLabel(this.error, translate)})}`);

    const store: {[key: string]: string} = {};

    const description: Array<string> = [translate('errors.invalid_arguments') + '\n'];
    for (let key in errors) {
      const message = errors[key].message;
      if (message in store) {
        description.push(`**${key}**: ${translate('errors.same_error_as', {key: `**${store[message]}**`})}`);
      } else {
        description.push(`**${key}**: ${message}`);
      }
      store[message] = key;
    }
  
    embed.setDescription(description.join('\n'));
    return editOrReply(context, {
      embed,
      flags: MessageFlags.EPHEMERAL,
    });
  }
}


export class BaseInteractionCommandOption extends Interaction.InteractionCommandOption {
  blockedCommandShouldStillExecute = true;
  error = 'Slash';
  type = ApplicationCommandOptionTypes.SUB_COMMAND;

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.cancel_run', {command: `\`${command}\``, label: translateErrorLabel(this.error, translate)})}`,
      flags: MessageFlags.EPHEMERAL,
    });
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

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_audio_video_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.invalid_user_or_url')}`,
        flags: MessageFlags.EPHEMERAL,
      });
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

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_images_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.invalid_user_or_url')}`,
        flags: MessageFlags.EPHEMERAL,
      });
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

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_images_videos_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.invalid_user_or_url')}`,
        flags: MessageFlags.EPHEMERAL,
      });
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

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_media_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.invalid_user_or_url')}`,
        flags: MessageFlags.EPHEMERAL,
      });
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
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_media_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.urls.length < this.minAmount) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history_amount', {amount: this.minAmount})}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.not_enough_media_found', {amount: this.minAmount})}`);
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.too_many_media_found')}`);
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

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${StatusEmojis.WARNING} ${translate('errors.no_channel_history')}`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.no_videos_found')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('errors.invalid_user_or_url')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionCommandOptionGroup extends Interaction.InteractionCommandOption {
  error = 'Slash';
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${StatusEmojis.WARNING} ${translate('errors.cancel_run_group', {command: `\`${command}\``, label: translateErrorLabel(this.error, translate)})}`,
      flags: MessageFlags.EPHEMERAL,
    });
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
