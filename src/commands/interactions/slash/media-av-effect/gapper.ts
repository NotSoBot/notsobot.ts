import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'gapper';

export class MediaAVAudioGapperCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Put gaps of silence in an Audio or Video\'s audio, or snip pieces out (Gapper/Snipper)';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.gapper.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioGapper.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.gapper.name');

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Gaps per second in Hz, 0.1 to 100 (Default: 10)', ...I18n.optionLocalizations('commands.media_av.audio.gapper.frequency'), type: 'number'},
        {name: 'length', description: 'How long each gap is in milliseconds, 1 to 1000 (Default: 50)', ...I18n.optionLocalizations('commands.media_av.audio.gapper.length'), type: 'number'},
        {name: 'snip', description: 'Cut the audio out instead of adding silence (Default: False)', ...I18n.optionLocalizations('commands.media_av.audio.gapper.snip'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioGapper.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioGapper.createMessage(context, args);
  }
}
