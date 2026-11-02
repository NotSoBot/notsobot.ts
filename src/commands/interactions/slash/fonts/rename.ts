import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class FontsRenameCommand extends BaseInteractionCommandOption {
  description = 'Rename one of your saved fonts';
  metadata = {
    id: Formatter.Commands.FontsRename.COMMAND_ID,
  };
  name = 'rename';

  constructor() {
    super({
      options: [
        {name: 'name', description: 'The saved font', required: true, onAutoComplete: Parameters.AutoComplete.savedFontUser},
        {name: 'new-name', description: 'Its new name, letters, numbers and _', label: 'newName', required: true, maxLength: 32},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FontsRename.CommandArgs) {
    return Formatter.Commands.FontsRename.createMessage(context, args);
  }
}
