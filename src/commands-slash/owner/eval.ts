import { Slash } from 'detritus-client';
import { ApplicationCommandOptionTypes, InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { DefaultParameters, Parameters, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async?: boolean,
  code: string,
  jsonspacing?: number,
  noembed?: boolean,
}


export const COMMAND_NAME = 'eval';

export default class EvalCommand extends BaseCommand {
  constructor() {
    super({
      description: 'Eval some code ;)',
      name: COMMAND_NAME,
      options: [
        {name: 'code', type: ApplicationCommandOptionTypes.STRING, description: 'Code to evaluate', required: true},
        {name: 'async', type: ApplicationCommandOptionTypes.BOOLEAN, description: 'Wrap the code in an async block'},
        {name: 'jsonspacing', type: ApplicationCommandOptionTypes.INTEGER, description: 'Spacing for the JSON encoder'},
        {name: 'noembed', type: ApplicationCommandOptionTypes.BOOLEAN, description: 'Output the result without an Embed'},
      ],
    });
  }

  onBefore(context: Slash.SlashContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Slash.SlashContext) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'no',
      flags: 64,
    });
  }

  async run(context: Slash.SlashContext, args: CommandArgs) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'ok',
      flags: 64,
    });
  }
}
