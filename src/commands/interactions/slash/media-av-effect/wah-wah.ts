import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wah-wah';

export class MediaAVAudioWahWahCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add a wah-wah to an Audio or Video, a band of the sound sweeping up and down';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.wah_wah.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioWahWah.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.wah_wah.name');

  constructor() {
    super({
      options: [
        {name: 'rate', description: 'Sweeps per second in Hz, 0.1 to 10 (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.wah_wah.rate'), type: 'number'},
        {name: 'depth', description: 'How wide the sweep is, 0 to 100 (Default: 70)', ...I18n.optionLocalizations('commands.media_av.audio.wah_wah.depth'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioWahWah.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioWahWah.createMessage(context, args);
  }
}
