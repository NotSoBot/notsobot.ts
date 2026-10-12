import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flanger';

export class MediaAVAudioFlangerCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Apply a Flanger Effect on an Audio or Video';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.flanger.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioFlanger.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Base delay in milliseconds (Default: 0)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.delay'), type: Number},
        {name: 'depth', description: 'Added sweep delay in milliseconds (Default: 2)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.depth'), type: Number},
        {name: 'phase', description: 'Swept wave percentage-shift for multi channel (Default: 25)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.phase'), type: Number},
        {name: 'regen', description: 'Percentage regeneration - delayed signal feedback (Default: 0)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.regen'), type: Number},
        {name: 'speed', description: 'Sweeps per second in Hz (Default: 0.5)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.speed'), type: 'number'},
        {name: 'width', description: 'Percentage of delayed signal mixed with original (Default: 71)', ...I18n.optionLocalizations('commands.media_av.audio.flanger.width'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioFlanger.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioFlanger.createMessage(context, args);
  }
}
