import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedBrands, EmbedColors } from '../../../../constants';
import { DefaultParameters, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export interface CommandArgs {
  async?: boolean,
  code: string,
  jsonspacing?: number,
  noembed?: boolean,
  noreply?: boolean,
}

export const COMMAND_NAME = 'eval';

export class OwnerEvalCommand extends BaseInteractionCommandOption<CommandArgs> {
  description = 'Eval some code ;)';
  name = COMMAND_NAME;
  triggerLoadingAfter = 2000;

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to evaluate', required: true},
        {name: 'async', type: Boolean, description: 'Wrap the code in an async block'},
        {name: 'jsonspacing', type: Number, description: 'Spacing for the JSON encoder'},
        {name: 'noembed', type: Boolean, description: 'Output the result without an Embed'},
        {name: 'noreply', type: Boolean, description: 'Do not reply'},
      ],
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Interaction.InteractionContext) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'no',
      flags: 64,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const code = Parameters.codeblock(args.code);

    let language = 'js';
    let message: any;
    let errored: boolean = false;
    try {
      if (args.async) {
        const func = new AsyncFunction('context', code);
        message = await func(context);
      } else {
        message = await Promise.resolve(eval(code));
      }
      if (typeof(message) === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch(error) {
      message = (error) ? error.stack || error.message : error;
      errored = true;
    }

    if (!args.noreply) {
      const content = String(message);
      if (!args.noembed) {
        const embed = new Embed();
        if (errored) {
          embed.setColor(EmbedColors.ERROR);
        } else {
          embed.setColor(EmbedColors.DEFAULT);
        }
        embed.setDescription(Markup.codeblock(content, {language, mentions: false}));
        embed.setFooter('Eval', EmbedBrands.NOTSOBOT);

        return editOrReply(context, {embed});
      }
      return editOrReply(context, Markup.codeblock(content, {language}));
    }
  }
}
