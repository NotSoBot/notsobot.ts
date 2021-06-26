import { URL } from 'url';

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';
import { Timers } from 'detritus-utils';

import { createUserCommand } from '../api';
import { CommandTypes, DiscordReactionEmojis, EmbedColors, PermissionsText, RatelimitKeys } from '../constants';
import { Parameters, createUserEmbed, editOrReply, findImageUrlInMessages } from '../utils';


// description and usage shouldnt be optional, temporary for now
export interface CommandMetadata {
  description?: string,
  examples?: Array<string>,
  nsfw?: boolean,
  type: CommandTypes,
  usage?: string,
}

export interface ContextMetadata {
  contentUrl?: string,
  responseUrl?: string,
}

export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  metadata!: CommandMetadata;
  permissionsIgnoreClientOwner = true;
  triggerTypingAfter = 2000;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 500, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  get commandDescription(): string {
    if (typeof(this.metadata.usage) === 'string') {
      return `${this.fullName} ${this.metadata.usage}`.trim();
    }
    return '';
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
    return editOrReply(context, `⚠ ${command} requires the bot to have ${permissions.join(', ')} to work.`);
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
    return editOrReply(context, `⚠ ${command} requires you to have ${permissions.join(', ')}.`);
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
          noun = 'This guild is';
        }; break;
        case 'guild': {
          noun = 'This channel is';
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
    embed.setTitle('⚠ Command Error');

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
    } else {
      description.push(error.message || error.stack);
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

    if (context.command) {
      let contentUrl: string | undefined;
      let responseUrl: string | undefined;
      if (context.metadata) {
        ({contentUrl, responseUrl} = context.metadata as ContextMetadata);
      }

      const name = context.command.fullName;
      await createUserCommand(
        context,
        context.userId,
        name,
        {
          channelId: context.channelId,
          content: context.message.content,
          contentUrl,
          editedTimestamp: context.message.editedAtUnix,
          failedReason: String(error.message || error.stack).slice(0, 256),
          guildId: context.guildId,
          messageId: context.messageId,
          responseId: message.id,
          responseUrl,
        },
      );
    }

    return message;
  }

  async onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    // log command
    if (context.command) {
      let contentUrl: string | undefined;
      let responseUrl: string | undefined;
      if (context.metadata) {
        ({contentUrl, responseUrl} = context.metadata as ContextMetadata);
      }

      const name = context.command.fullName;
      try {
        await createUserCommand(
          context,
          context.userId,
          name,
          {
            channelId: context.channelId,
            content: context.message.content,
            contentUrl,
            editedTimestamp: context.message.editedAtUnix,
            guildId: context.guildId,
            messageId: context.messageId,
            responseId: (context.response) ? context.response.id : undefined,
            responseUrl,
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
    embed.setTitle('⚠ Command Argument Error');

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

export class BaseImageCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
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
      type: Parameters.lastImageUrl,
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
      return editOrReply(context, '⚠ Unable to find any images in the last 50 messages.');
    } else if (args.url === null) {
      return editOrReply(context, '⚠ Unable to find that user or it was an invalid url.');
    }
    return super.onCancelRun(context, args);
  }

  onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    if (context.response) {
      const responseUrl = findImageUrlInMessages([context.response]);
      if (responseUrl) {
        context.metadata = Object.assign({}, context.metadata, {responseUrl});
      }
    }
    return super.onSuccess(context, args);
  }
}


export class BaseSearchCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  nsfw = false;

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
    if (this.metadata) {
      this.metadata.nsfw = this.nsfw;
    }
  }

  onBefore(context: Command.Context) {
    if (this.nsfw) {
      if (context.channel) {
        return context.channel.isDm || context.channel.nsfw;
      }
      return context.inDm;
    }
    return true;
  }

  onCancel(context: Command.Context) {
    return editOrReply(context, '⚠ Not a NSFW channel.');
  }

  onBeforeRun(context: Command.Context, args: {query: string}) {
    return !!args.query;
  }
}
