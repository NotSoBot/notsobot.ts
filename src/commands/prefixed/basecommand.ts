import { URL } from 'url';

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Response } from 'detritus-rest';
import { Timers } from 'detritus-utils';

import GuildSettingsStore from '../../stores/guildsettings';
import UserStore from '../../stores/users';

import { createUserCommand } from '../../api';
import {
  BooleanEmojis,
  CommandCategories,
  DiscordReactionEmojis,
  DiscordSkuIds,
  EmbedColors,
  GuildFeatures,
  PermissionsText,
  RatelimitKeys,
  UserFlags,
  UserPremiumTypes,
} from '../../constants';
import { Parameters, createUserEmbed, editOrReply, findMediaUrlInMessages } from '../../utils';


// description and usage shouldnt be optional, temporary for now
export interface CommandMetadata {
  category: CommandCategories,
  description?: string,
  examples?: Array<string>,
  id?: string,
  nsfw?: boolean,
  premium?: boolean,
  premiumPlus?: boolean,
  premiumServer?: GuildFeatures | boolean,
  usage?: string,
}

export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  permissionsIgnoreClientOwner = true;
  triggerTypingAfter = 2000;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 10, type: 'guild'},
        {duration: 500, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  get commandDescription(): string {
    const metadata = this.metadata as CommandMetadata;
    if (typeof(metadata.usage) === 'string') {
      return `${this.fullName} ${metadata.usage}`.trim();
    }
    return '';
  }

  onBefore(context: Command.Context): Promise<boolean> | boolean {
    return new Promise(async (resolve) => {
      const contextMetadata = context.metadata = context.metadata || {};
  
      const metadata = (context.command || {}).metadata;
      if (metadata) {
        if (metadata.nsfw) {
          const isNSFWAllowed = !!(context.inDm || (context.channel && (context.channel.isDm || context.channel.nsfw)));
          if (!isNSFWAllowed) {
            contextMetadata.reason = `${BooleanEmojis.WARNING} Not a NSFW channel.`;
            return resolve(isNSFWAllowed);
          }
        }
        if (metadata.premium || metadata.premiumPlus || metadata.premiumServer) {
          let hasPremium: boolean = false;
          const user = await UserStore.getOrFetch(context, context.userId);
          if (user) {
            if (metadata.premiumPlus) {
              hasPremium = (
                (user.premiumType === UserPremiumTypes.PREMIUM_FREE) ||
                (user.premiumType === UserPremiumTypes.PREMIUM_PLUS) ||
                (user.hasFlag(UserFlags.OWNER))
              );
            } else {
              hasPremium = !!user.premiumType || user.hasFlag(UserFlags.OWNER);
            }
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
            }
          }
  
          if (!hasPremium) {
            context.metadata = context.metadata || {};
            if (metadata.premiumServer) {
              context.metadata.reason = `You or the Server Owner must have NotSoPremium to use ${Markup.codestring(this.fullName)}!`;
            } else if (metadata.premiumPlus) {
              context.metadata.reason = `You must have NotSoPremium Plus to use ${Markup.codestring(this.fullName)}!`;
            } else {
              context.metadata.reason = `You must have NotSoPremium to use ${Markup.codestring(this.fullName)}!`;
            }
            context.metadata.reasonIsPremiumRequired = true;
            return resolve(hasPremium);
          }
        }
      }
      return resolve(true);
    });
  }

  onCancel(context: Command.Context) {
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
      return editOrReply(context, contextMetadata.reason);
    }
  }

  onCancelRun(context: Command.Context, args: unknown) {
    const description = this.commandDescription;
    if (description) {
      return editOrReply(context, Markup.codeblock(`${context.prefix}${description}`));
    }
    return editOrReply(context, 'lol idk how to use this command');
  }

  onPermissionsFailClient(context: Command.Context, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    let command: string;
    if (context.command) {
      command = '`' + (context.command.fullName) + '`';
    } else {
      command = 'This command';
    }
    return editOrReply(context, `${BooleanEmojis.WARNING} ${command} requires the bot to have ${permissions.join(', ')} to work.`);
  }

  onPermissionsFail(context: Command.Context, failed: Array<bigint>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      const key = String(permission);
      if (key in PermissionsText) {
        permissions.push(`\`${PermissionsText[key]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    let command: string;
    if (context.command) {
      command = '`' + (context.command.fullName) + '`';
    } else {
      command = 'This command';
    }
    return editOrReply(context, `${BooleanEmojis.WARNING} ${command} requires you to have ${permissions.join(', ')}.`);
  }

  async onRatelimit(
    context: Command.Context,
    ratelimits: Array<Command.CommandRatelimitInfo>,
    metadata: Command.CommandRatelimitMetadata,
  ) {
    const { message } = context;
    if (!message.canReply && !message.canReact) {
      return;
    }
    const { global } = metadata;
  
    let replied: boolean = false;
    for (const {item, ratelimit, remaining} of ratelimits) {
      if ((remaining < 1000 && !replied && !item.replied) || !message.canReply) {
        const { message } = context;
        if (!message.deleted && message.canReact && !message.reactions.has(DiscordReactionEmojis.WAIT.id)) {
          await message.react(`${DiscordReactionEmojis.WAIT.name}:${DiscordReactionEmojis.WAIT.id}`);
        }
        replied = item.replied = true;
        continue;
      }
  
      if (remaining < 1000 || replied || item.replied) {
        // skip replying
        item.replied = true;
        continue;
      }
      replied = item.replied = true;
  
      let noun: string = 'You idiots are';
      switch (ratelimit.type) {
        case 'channel': {
          noun = 'This channel is';
        }; break;
        case 'guild': {
          noun = 'This guild is';
        }; break;
        case 'user': {
          noun = 'You are';
        }; break;
      }
  
      let content: string;
      if (global) {
        content = `${noun} using commands WAY too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
      } else {
        content = `${noun} using ${this.fullName} too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
      }
  
      try {
        const reply = await context.reply(content);
        await Timers.sleep(Math.max(remaining / 2, 2000));
        item.replied = false;
        if (!reply.deleted) {
          await reply.delete();
        }
      } catch(e) {
        item.replied = false;
      }
    }
  }

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${BooleanEmojis.WARNING} Command Error`);

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
    embed.setDescription(description.join('\n').slice(0, 4096));

    if (error.metadata) {
      embed.addField('Metadata', [
        '```json',
        JSON.stringify(error.metadata),
        '```',
      ].join('\n'));
    }

    const message = await editOrReply(context, {embed});
    if (context.command && context.command.metadata) {
      const metadata = context.command.metadata;
      const commandId = metadata.id || context.command.fullName.split(' ').join('.');
      await createUserCommand(
        context,
        context.userId,
        commandId,
        {
          channelId: context.channelId,
          editedTimestamp: context.message.editedAtUnix,
          failedReason: String(error.message || error.stack).slice(0, 256),
          guildId: context.guildId,
          messageId: context.messageId,
          responseId: message.id,
        },
      );
    }

    return message;
  }

  async onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    // log command
    if (context.command) {
      const metadata = context.command.metadata;
      const commandId = metadata.id || context.command.fullName.split(' ').join('.');
      try {
        await createUserCommand(
          context,
          context.userId,
          commandId,
          {
            channelId: context.channelId,
            editedTimestamp: context.message.editedAtUnix,
            guildId: context.guildId,
            messageId: context.messageId,
            responseId: (context.response) ? context.response.id : undefined,
          },
        );
      } catch(error) {
        // do something?
      }
    }
  }

  onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle(`${BooleanEmojis.WARNING} Command Argument Error`);

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
    return editOrReply(context, {embed});
  }
}


export class BaseMediaCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  triggerTypingAfter = 250;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      label: 'url',
      name: '',
      permissionsClient: [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.IMAGE, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.IMAGE, type: 'channel'},
      ],
      type: options.type || Parameters.lastMediaUrl(),
      ...options,
    });
  }

  onBeforeRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any media in the last 50 messages.`);
    } else if (args.url === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`);
    }
    return super.onCancelRun(context, args);
  }

  onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    if (context.response) {
      const responseUrl = findMediaUrlInMessages([context.response], {audio: false, video: false});
      if (responseUrl) {
        context.metadata = Object.assign({}, context.metadata, {responseUrl});
      }
    }
    return super.onSuccess(context, args);
  }
}


export class BaseMediasCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  maxAmount = 2;
  minAmount = 0;
  triggerTypingAfter = 250;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      label: 'urls',
      name: '',
      permissionsClient: [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.IMAGE, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.IMAGE, type: 'channel'},
      ],
      type: options.type || Parameters.mediaUrls({
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }

  onBeforeRun(context: Command.Context, args: {urls: Array<string>}) {
    return !!args.urls.length && args.urls.length <= this.maxAmount && this.minAmount <= args.urls.length;
  }

  onCancelRun(context: Command.Context, args: {urls: Array<string>}) {
    if (!args.urls.length) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any media in the last 50 messages.`);
    } else if (args.urls.length < this.minAmount) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find ${this.minAmount} media urls in the last 50 messages.`);
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return editOrReply(context, `${BooleanEmojis.WARNING} Found too many media urls in the last 50 messages.`);
    }
    return super.onCancelRun(context, args);
  }

  onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    if (context.response) {
      const responseUrl = findMediaUrlInMessages([context.response], {audio: false, video: false});
      if (responseUrl) {
        context.metadata = Object.assign({}, context.metadata, {responseUrl});
      }
    }
    return super.onSuccess(context, args);
  }
}


export class BaseAudioOrVideoCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({image: false}),
      ...options,
    });
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any audio or videos in the last 50 messages.`);
    } else if (args.url === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`);
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseAudioOrVideosCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediasCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      type: options.type || Parameters.mediaUrls({
        audio: true,
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
        image: false,
        video: true,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }

  onCancelRun(context: Command.Context, args: {urls: Array<string>}) {
    if (!args.urls.length) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any audio or videos in the last 50 messages.`);
    } else if (args.urls.length < this.minAmount) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find ${this.minAmount} audio or video urls in the last 50 messages.`);
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return editOrReply(context, `${BooleanEmojis.WARNING} Found too many audio or video urls in the last 50 messages.`);
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseImageCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({audio: false, video: false}),
      ...options,
    });
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any images in the last 50 messages.`);
    } else if (args.url === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`);
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseImageOrVideoCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({audio: false}),
      ...options,
    });
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any images or videos in the last 50 messages.`);
    } else if (args.url === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user or it was an invalid url.`);
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseImageOrVideosCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediasCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      type: options.type || Parameters.mediaUrls({
        audio: false,
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
        image: true,
        video: true,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }

  onCancelRun(context: Command.Context, args: {urls: Array<string>}) {
    if (!args.urls.length) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any image or videos in the last 50 messages.`);
    } else if (args.urls.length < this.minAmount) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find ${this.minAmount} image or video urls in the last 50 messages.`);
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return editOrReply(context, `${BooleanEmojis.WARNING} Found too many image or video urls in the last 50 messages.`);
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseSearchCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      label: 'query',
      permissionsClient: [Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.SEARCH, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.SEARCH, type: 'channel'},
      ],
      ...options,
    });
  }

  onBeforeRun(context: Command.Context, args: {query: string}) {
    return !!args.query;
  }
}
