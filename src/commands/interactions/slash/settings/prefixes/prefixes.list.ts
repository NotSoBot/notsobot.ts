import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class SettingsPrefixesListCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Prefixes';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.SettingsPrefixesList.createMessage(context);
  }
}
