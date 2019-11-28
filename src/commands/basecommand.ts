import { Command, CommandClient, Constants, Utils } from 'detritus-client';
const { Permissions } = Constants;

import { EmbedColors, PermissionsText } from '../constants';


export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  onPermissionsFailClient(context: Command.Context, failed: Array<Constants.Permissions>) {
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

  onPermissionsFail(context: Command.Context, failed: Array<Constants.Permissions>) {
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


/*

onBeforeRun(context: Command.Context, args: CommandArgsBefore) {

}

onCancelRun(context: Command.Context, args: CommandArgsBefore) {

}

async run(context: Command.Context, args: CommandArgs) {

}
*/
