import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'join';

export class MediaAIVJoinCommand extends BaseInteractionMediasCommandOption {
  description = 'Put two Images or Videos side by side (or stacked)';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.join.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationJoin.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.join.name');

  constructor() {
    super({
      options: [
        {name: 'noresize', description: 'Do not resize media', ...I18n.optionLocalizations('commands.media_aiv.join.noresize'), type: Boolean},
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media timestamp', ...I18n.optionLocalizations('commands.media_aiv.join.noloop'), type: Boolean},
        {name: 'vertical', description: 'Join the media vertically', ...I18n.optionLocalizations('commands.media_aiv.join.vertical'), type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationJoin.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationJoin.createMessage(context, args);
  }
}
