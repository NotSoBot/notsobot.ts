import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  global?: boolean,
  user: Structures.Member | Structures.User,
}

export class TagListUserCommand extends BaseInteractionCommandOption {
  description = 'List all of a User\'s Tags';
  name = 'user';

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to list tags for',
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'content',
          description: 'Match the tag\'s content',
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'global',
          description: 'Only show global tags',
          type: Boolean,
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          value: Parameters.string({maxLength: 64}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.TagListUser.createMessage(context, args);
  }
}
