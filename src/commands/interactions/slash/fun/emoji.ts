import { Interaction } from 'detritus-client';

import { EmojiTypes } from '../../../../constants';
import { Formatter, Parameters, toTitleCase } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'emoji';

export class EmojiCommand extends BaseInteractionCommandOption {
  description = 'Make an Emoji Big!';
  metadata = {
    id: Formatter.Commands.FunEmoji.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
	  super({
		  options: [
		    {name: 'emojis', description: 'Max 10 Emojis Allowed', required: true},
		    {
			    name: 'type',
			    description: 'Emoji Platform Type',
			    choices: Formatter.Commands.FunEmoji.SLASH_CHOICES,
          default: Formatter.Commands.FunEmoji.DEFAULT_EMOJI_TYPE,
		    },
		    {
          name: 'size',
          description: `Emoji Size (Default: 512)`,
          maxValue: 2048,
          minValue: 8,
          type: Number,
          default: 512,
        },
		  ],
	  });
	}

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunEmoji.CommandArgs) {
    return Formatter.Commands.FunEmoji.createMessage(context, args);
  }
}
