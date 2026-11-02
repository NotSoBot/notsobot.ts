import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class FontsRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove one of your saved fonts';
  metadata = {
    id: Formatter.Commands.FontsRemove.COMMAND_ID,
  };
  name = 'remove';

  constructor() {
    super({
      options: [
        {name: 'name', description: 'The saved font', required: true, onAutoComplete: Parameters.AutoComplete.savedFontUser},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FontsRemove.CommandArgs) {
    return Formatter.Commands.FontsRemove.createMessage(context, args);
  }
}
