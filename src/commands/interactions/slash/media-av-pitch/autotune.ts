import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'autotune';

export class MediaAVAudioAutotuneCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Autotune the voice in an Audio or Video onto the notes of a key';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.autotune.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioAutotune.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.autotune.name');

  constructor() {
    super({
      options: [
        {name: 'key', description: 'Key to snap to, like C, F#, Am, Bb minor or chromatic (Default: C)', ...I18n.optionLocalizations('commands.media_av.audio.autotune.key')},
        {name: 'strength', description: 'How far each note is pulled, 0 to 1, 1 snaps all the way (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.autotune.strength'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioAutotune.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioAutotune.createMessage(context, args);
  }
}
