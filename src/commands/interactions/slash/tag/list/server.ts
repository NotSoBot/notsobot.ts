import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagListServerCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Tags';
  name = 'server';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Match the tag\'s name with this',
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'User to list tags for',
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagListServer.CommandArgs) {
    return Formatter.Commands.TagListServer.createMessage(context, args);
  }
}
