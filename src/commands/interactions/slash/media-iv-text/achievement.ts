import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'achievement';

export class MediaIVAchievementCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Xbox "Achievement unlocked" popup with your own text on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.achievement.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayAchievement.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.achievement.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Achievement name',
          ...I18n.optionLocalizations('commands.media_iv_text.achievement.text'),
          maxLength: 100,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'gamerscore',
          description: 'Gamerscore it\'s worth (0..9999) (Default: 100)',
          ...I18n.optionLocalizations('commands.media_iv_text.achievement.gamerscore'),
          maxValue: 9999,
          minValue: 0,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayAchievement.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayAchievement.createMessage(context, args);
  }
}
