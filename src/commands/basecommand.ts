import { Command, CommandClient, Constants, Utils } from 'detritus-client';
const { Permissions } = Constants;

import { EmbedColors, PermissionsText } from '../constants';


export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  permissionsClient = [Permissions.EMBED_LINKS];

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  onPermissionsFail(context: Command.Context, failed: Command.FailedPermissions) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    return context.editOrReply(`⚠ This command requires you to have ${permissions.join(', ')}.`);
  }

  onPermissionsFailClient(context: Command.Context, failed: Command.FailedPermissions) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }

    return context.editOrReply(`⚠ This command requires the bot to have ${permissions.join(', ')} to work.`);
  }

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Error');
  
    const description: Array<string> = [(error.message || error.stack) + '\n'];
    if (error.response) {
      try {
        const information = await error.response.json();
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
        description.push(`**Mimetype**: ${error.response.contentType}`);
      }
    }
  
    embed.setDescription(description.join('\n'));
    return context.editOrReply({embed});
  }

  onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Argument Error');
  
    const description: Array<string> = ['Invalid Arguments' + '\n'];
    for (let key in errors) {
      description.push(`**${key}**: ${errors[key].message}`);
    }
  
    embed.setDescription(description.join('\n'));
    return context.editOrReply({embed});
  }
}
