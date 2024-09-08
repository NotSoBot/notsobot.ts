import { URL } from 'url';

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';
import { Timers } from 'detritus-utils';

import { createUserCommand } from '../../api';
import {
  BooleanEmojis,
  CommandCategories,
  DiscordReactionEmojis,
  EmbedColors,
  PermissionsText,
  RatelimitKeys,
} from '../../constants';
import { Parameters, createUserEmbed, editOrReply, findMediaUrlInMessages } from '../../utils';


// description and usage shouldnt be optional, temporary for now
export interface CommandMetadata {
  category: CommandCategories,
  description?: string,
  examples?: Array<string>,
  id?: string,
  nsfw?: boolean,
  usage?: string,
}

export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  nsfw = false;

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
    if (this.metadata) {
      this.nsfw = this.metadata.nsfw || this.nsfw;
      this.metadata.nsfw = this.nsfw;
    }
  }

  get commandDescription(): string {
    const metadata = this.metadata as CommandMetadata;
    if (typeof(metadata.usage) === 'string') {
      return `${this.fullName} ${metadata.usage}`.trim();
    }
    return '';
  }

  onBefore(context: Command.Context): Promise<boolean> | boolean {
    if (this.nsfw) {
      if (context.channel) {
        return context.channel.isDm || context.channel.nsfw;
      }
      return context.inDm;
    }
    return true;
  }

  onCancel(context: Command.Context) {
    if (this.nsfw) {
      if (!context.inDm && (context.channel && (!context.channel.isDm || !context.channel.nsfw))) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Not a NSFW channel.`);
      }
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
