import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'realfact';

export class MediaIRealfactCommand extends BaseInteractionCommandOption {
  description = 'Put text on a Snapple "Real Fact" cap';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.realfact.description');
  metadata = {
    id: Formatter.Commands.MediaICreateRealfact.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.realfact.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'The fact',
          ...I18n.optionLocalizations('commands.media_i.fun.realfact.text'),
          maxLength: 200,
          required: true,
          value: Parameters.string({maxLength: 200}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateRealfact.CommandArgs) {
    return Formatter.Commands.MediaICreateRealfact.createMessage(context, args);
  }
}
