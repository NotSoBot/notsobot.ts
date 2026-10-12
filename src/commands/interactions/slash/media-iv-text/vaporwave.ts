import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';



export const COMMAND_NAME = 'vaporwave';

export class MediaIVVaporwaveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Vaporwave-theme an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.vaporwave.description');
  metadata = {
	id: Formatter.Commands.MediaIVManipulationVaporwave.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
	super({
	  options: [
		{name: 'text', description: 'Vaporwave Text', ...I18n.optionLocalizations('commands.media_iv_text.vaporwave.text'), value: Parameters.parsedMentionsText},
	  ],
	});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationVaporwave.CommandArgs) {
	return Formatter.Commands.MediaIVManipulationVaporwave.createMessage(context, args);
  }
}
