import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { createUserCommand } from '../api';
import { CommandTypes, EmbedColors, PermissionsText } from '../constants';
import { Parameters, editOrReply, findImageUrlInMessages } from '../utils';

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
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  get commandDescription(): string {
    return Markup.codeblock((this.metadata.usage) ? this.metadata.usage : 'lol idk');
  }

  onCancelRun(context: Command.Context, args: unknown) {
    return editOrReply(context, this.commandDescription);
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
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
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
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
    return editOrReply(context, `⚠ ${command} requires you to have ${permissions.join(', ')}.`);
  }

  async onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    // log command
    if (context.command) {
      let contentUrl: string | undefined;
      let responseUrl: string | undefined;
      if (context.metadata) {
        ({contentUrl, responseUrl} = context.metadata as ContextMetadata);
      }

      try {
        await createUserCommand(
          context,
          context.userId,
          context.command.name,
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

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    const embed = new Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Error');

    const description: Array<string> = [(error.message || error.stack) + '\n'];
    if (error.response) {
      const response: Response = error.response;
      try {
        const information = await response.json() as any;
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
      } catch(e) {
        description.push('Could not parse');
        description.push(`**Mimetype**: ${response.headers.get('content-type')}`);
      }
    }

    embed.setDescription(description.join('\n'));
    const message = await editOrReply(context, {embed});

    if (context.command) {
      let contentUrl: string | undefined;
      let responseUrl: string | undefined;
      if (context.metadata) {
        ({contentUrl, responseUrl} = context.metadata as ContextMetadata);
      }

      await createUserCommand(
        context,
        context.userId,
        context.command.name,
        {
          channelId: context.channelId,
          content: context.message.content,
          contentUrl,
          editedTimestamp: context.message.editedAtUnix,
          failedReason: String(error.message || error.stack),
          guildId: context.guildId,
          messageId: context.messageId,
          responseId: message.id,
          responseUrl,
        },
      );
    }

    return message;
  }

  onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    const embed = new Embed();
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
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      label: 'url',
      name: '',
      permissionsClient: [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 2, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
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
      return editOrReply(context, '⚠ Unable to find any messages with an image.');
    }
    return editOrReply(context, '⚠ Unable to find that user or it was an invalid url.');
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
