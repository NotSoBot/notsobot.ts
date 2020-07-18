import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';
import { Response } from 'detritus-rest';

import { CommandTypes, EmbedColors, PermissionsText } from '../constants';
import { Parameters } from '../utils';

// description and usage shouldnt be optional, temporary for now
export interface CommandMetadata {
  description?: string,
  examples?: Array<string>,
  nsfw?: boolean,
  type: CommandTypes,
  usage?: string,
}

export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  metadata!: CommandMetadata;
  permissionsIgnoreClientOwner = true;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  onPermissionsFailClient(context: Command.Context, failed: Array<Permissions>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
    return context.editOrReply(`⚠ ${command} requires the bot to have ${permissions.join(', ')} to work.`);
  }

  onPermissionsFail(context: Command.Context, failed: Array<Permissions>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
    return context.editOrReply(`⚠ ${command} requires you to have ${permissions.join(', ')}.`);
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
    return context.editOrReply({embed});
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
    return context.editOrReply({embed});
  }
}

export class BaseImageCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  label = 'url';
  permissionsClient = [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS];
  type = Parameters.lastImageUrl;

  onBeforeRun(context: Command.Context, args: {url?: null | string}) {
    return !!args.url;
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    }
    return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
  }
}


export class BaseSearchCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  label = 'query';
  nsfw = false;
  permissionsClient = [Permissions.EMBED_LINKS];

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, options);
    if (this.metadata) {
      this.metadata.nsfw = this.nsfw;
    }
  }

  onBefore(context: Command.Context) {
    if (this.nsfw) {
      if (context.channel) {
        return context.channel.isDm || context.channel.nsfw;
      }
      return false;
    }
    return true;
  }

  onCancel(context: Command.Context) {
    return context.editOrReply('⚠ Not a NSFW channel.');
  }

  onBeforeRun(context: Command.Context, args: {query: string}) {
    return !!args.query;
  }

  onCancelRun(context: Command.Context, args: {query: string}) {
    return context.editOrReply('⚠ Provide some kind of search term.');
  }
}

/*

onBeforeRun(context: Command.Context, args: CommandArgsBefore) {

}

onCancelRun(context: Command.Context, args: CommandArgsBefore) {

}

async run(context: Command.Context, args: CommandArgs) {

}
*/
