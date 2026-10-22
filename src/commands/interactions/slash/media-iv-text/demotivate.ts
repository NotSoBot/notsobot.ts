import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'demotivate';

export class MediaIVDemotivateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into a demotivational poster';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.demotivate.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDemotivate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.demotivate.name');

  constructor() {
    super({
      options: [
        {
          name: 'title',
          description: 'Big title',
          ...I18n.optionLocalizations('commands.media_iv_text.demotivate.title'),
          maxLength: 100,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'text',
          description: 'Line under the title',
          ...I18n.optionLocalizations('commands.media_iv_text.demotivate.text'),
          maxLength: 200,
          value: Parameters.parsedMentionsText,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDemotivate.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDemotivate.createMessage(context, args);
  }
}
