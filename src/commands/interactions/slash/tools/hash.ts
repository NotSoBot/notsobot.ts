import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsHashCommand extends BaseInteractionCommandOption {
  description = 'Create a hash from some text';
  descriptionLocalizations = I18n.localizations('commands.tools.hash.description');
  metadata = {
    id: Formatter.Commands.ToolsHash.COMMAND_ID,
  };
  name = 'hash';

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to hash',
          ...I18n.optionLocalizations('commands.tools.hash.text'),
          required: true,
        },
        {
          name: 'secret',
          description: 'Secret to use for an HMAC',
          ...I18n.optionLocalizations('commands.tools.hash.secret'),
        },
        {
          name: 'use',
          description: 'Hash Type to Use',
          ...I18n.optionLocalizations('commands.tools.hash.use'),
          choices: Object.values(Formatter.Commands.ToolsHash.HashTypes).map((key) => {
            return {name: key, value: key};
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsHash.CommandArgs) {
    return Formatter.Commands.ToolsHash.createMessage(context, args);
  }
}
