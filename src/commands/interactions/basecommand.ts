import * as Sentry from '@sentry/node';

import { Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationCommandOptionTypes,
  InteractionCallbackTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { createUserCommand } from '../../api';
import { BooleanEmojis, CommandTypes, EmbedColors, PermissionsText } from '../../constants';
import { DefaultParameters, Parameters, editOrReply } from '../../utils';


export interface InteractionCommandMetadata {
  id: string,
  nsfw?: boolean,
};

export class BaseInteractionCommand extends Interaction.InteractionCommand {
  blockedCommandShouldStillExecute = true;
  error = 'Command';

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
    // check perms to maybe force as ephemeral, just in case
    return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  }

  onDmBlocked(context: Interaction.InteractionContext) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} \`${command}\` cannot be used in a DM.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    const metadata = context.invoker.metadata;
    if (metadata && metadata.nsfw) {
      if (context.channel) {
        return context.channel.isDm || context.channel.nsfw;
      }
      return context.inDm;
    }
    return true;
  }

  onCancel(context: Interaction.InteractionContext) {
    const metadata = context.invoker.metadata;
    if (metadata && metadata.nsfw) {
      if (!context.inDm && (context.channel && (!context.channel.isDm || !context.channel.nsfw))) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Not a NSFW channel.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
    }
  }

  onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} \`${command}\` error strangely, give me a report.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onPermissionsFailClient(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} ${command} requires the bot to have ${permissions.join(', ')} to work.`,
    });
  }

  onPermissionsFail(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} ${command} requires you to have ${permissions.join(', ')}.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async onRunError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, error: any) {
    const embed = new Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${BooleanEmojis.WARNING} ${this.error} Command Error`);

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
        if (response.statusCode === 502) {
          description.push('Our api is restarting, might take a bit. Sorry ;(');
        } else {
          description.push(`HTTP Exception: ${response.statusCode}`);
          const contentType = response.headers.get('content-type') || '';
          if (contentType.startsWith('text/html')) {
            // parse it?
          } else {
            description.push('Unknown Error Data');
            if (contentType) {
              description.push(`**Mimetype**: ${contentType}`);
            }
          }
        }
      }
    } else {
      const message = String(error.message || error.stack);
      if (message.includes('reason: connect ECONNREFUSED 127.0.0.1:80')) {
        description.push('Our api is restarting, might take a bit. Sorry ;(');
      } else {
        description.push(message);
      }
    }
    embed.setDescription(description.join('\n'));

    if (error.metadata) {
      embed.addField('Metadata', [
        '```json',
        JSON.stringify(error.metadata),
        '```',
      ].join('\n'));
    }

    await context.editOrRespond({
      embed,
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
        const commandId = metadata.id || context.name.split(' ').join('.')
        await createUserCommand(
          context,
          context.userId,
          commandId,
          {
            commandType,
            channelId: context.channelId!,
            failedReason: String(error.message || error.stack).slice(0, 256),
            guildId: context.guildId,
            messageId: context.interactionId,
            responseId: context.responseId,
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
            messageId: context.interactionId,
            responseId: context.responseId,
          },
        );
      }
    }
  }

  onValueError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, errors: Interaction.ParsedErrors) {
    const embed = new Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${BooleanEmojis.WARNING} ${this.error} Argument Error`);

    const store: {[key: string]: string} = {};

    const description: Array<string> = ['Invalid Arguments' + '\n'];
    for (let key in errors) {
      const message = errors[key].message;
      if (message in store) {
        description.push(`**${key}**: Same error as **${store[message]}**`);
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

  onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} \`${command}\` error strangely, give me a report.`,
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
        {name: 'url', description: 'Emoji/Media URL/User', label: 'url', default: DefaultParameters.lastMediaUrl({image: false}), value: Parameters.lastMediaUrl({image: false})},
        {name: 'attachment', description: 'Audio/Video File', type: ApplicationCommandOptionTypes.ATTACHMENT},
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
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any audio or videos in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`,
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
        {name: 'url', description: 'Emoji/Image URL/User', default: DefaultParameters.lastMediaUrl({audio: false, video: false}), value: Parameters.lastMediaUrl({audio: false, video: false})},
        {name: 'attachment', description: 'Image File', type: ApplicationCommandOptionTypes.ATTACHMENT},
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
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any images in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`,
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
        {name: 'url', description: 'Emoji/Media URL/User', default: DefaultParameters.lastMediaUrl({audio: false}), value: Parameters.lastMediaUrl({audio: false})},
        {name: 'attachment', description: 'Media File', type: ApplicationCommandOptionTypes.ATTACHMENT},
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
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any images or videos in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`,
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
        {name: 'url', description: 'Emoji/Media URL/User', default: DefaultParameters.lastMediaUrl(), value: Parameters.lastMediaUrl()},
        {name: 'attachment', description: 'Media File', type: ApplicationCommandOptionTypes.ATTACHMENT},
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
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any media in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`,
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

    const attachmentOptions = Array.from({length: data.maxAmount || 2}).map((x, key) => {
      return {
        name: `attachment-${key + 1}`,
        description: 'Media File',
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

  onCancelRun(context: Interaction.InteractionContext, args: {urls: Array<string>}) {
    if (!args.urls.length) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any media in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.urls.length < this.minAmount) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL to reach ${this.minAmount} media urls.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find ${this.minAmount} media urls in the last 50 messages.`);
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return editOrReply(context, `${BooleanEmojis.WARNING} Found too many media urls in the last 50 messages.`);
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
        {name: 'url', description: 'Emoji/Media URL/User', default: DefaultParameters.lastMediaUrl({audio: false, image: false}), value: Parameters.lastMediaUrl({audio: false, image: false})},
        {name: 'attachment', description: 'Video File', type: ApplicationCommandOptionTypes.ATTACHMENT},
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
    if (args.url === undefined) {
      if (!context.hasServerPermissions) {
        return editOrReply(context, {
          content: `${BooleanEmojis.WARNING} Bot cannot view the history of this channel, you must provide an attachment or URL.`,
          flags: MessageFlags.EPHEMERAL,
        });
      }
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find any videos in the last 50 messages.`,
        flags: MessageFlags.EPHEMERAL,
      });
    } else if (args.url === null) {
      return editOrReply(context, {
        content: `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`,
        flags: MessageFlags.EPHEMERAL,
      });
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionCommandOptionGroup extends Interaction.InteractionCommandOption {
  error = 'Slash';
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;

  onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `${BooleanEmojis.WARNING} ${this.error} \`${command}\` errored strangely, send a report to the devs please.`,
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
