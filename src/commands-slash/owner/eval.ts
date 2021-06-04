import { Slash } from 'detritus-client';
import { ApplicationCommandOptionTypes, InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { DefaultParameters, Parameters, editOrReply } from '../../utils';

import { BaseCommandOption } from '../basecommand';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async?: boolean,
  code: string,
  jsonspacing?: number,
  noembed?: boolean,
}

export const COMMAND_NAME = 'eval';

export class OwnerEvalCommand extends BaseCommandOption<CommandArgs> {
  description = 'Eval some code ;)';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to evaluate', required: true},
        {name: 'async', type: Boolean, description: 'Wrap the code in an async block'},
        {name: 'jsonspacing', type: Number, description: 'Spacing for the JSON encoder'},
        {name: 'noembed', type: Boolean, description: 'Output the result without an Embed'},
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
