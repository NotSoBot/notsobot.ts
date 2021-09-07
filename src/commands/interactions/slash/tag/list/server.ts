import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagListServerCommand extends BaseInteractionCommandOption {
  description = 'List all the Server\'s Tags';
  name = 'server';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.TagListServer.createMessage(context);
  }
}
