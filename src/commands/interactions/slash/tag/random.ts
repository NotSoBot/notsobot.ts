import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../basecommand';


export class TagRandomCommand extends BaseInteractionCommandOption {
  description = 'Show a random tag';
  metadata = {
    id: Formatter.Commands.TagRandom.COMMAND_ID,
  };
  name = 'random';

  constructor() {
    super({
      options: [
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
        },
        {
          name: 'content',
          description: 'Match the tag\'s content',
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'Pick a tag made by this User',
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'attachment',
          description: 'Media File',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
