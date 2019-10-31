import { Command, CommandClient, Utils } from 'detritus-client';

import { EmbedColors } from '../constants';


export class BaseCommand extends Command.Command {
  constructor(commandClient: CommandClient, options: Command.CommandOptions) {
    super(commandClient, Object.assign({
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  async onRunError(context: Command.Context, args: Command.ParsedArgs, error: any) {
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

  onTypeError(context: Command.Context, args: Command.ParsedArgs, errors: Command.ParsedErrors) {
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
