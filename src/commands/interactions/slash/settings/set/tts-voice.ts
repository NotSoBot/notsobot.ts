import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetTTSVoiceCommand extends BaseInteractionCommandOption {
  description = 'Set your default text-to-speech voice';
  descriptionLocalizations = I18n.localizations('commands.settings.set.tts_voice.description');
  metadata = {
    id: Formatter.Commands.SettingsSetTTSVoice.COMMAND_ID,
  };
  name = 'tts-voice';
  nameLocalizations = I18n.localizations('commands.settings.set.tts_voice.name');

  constructor() {
    super({
      options: [
        {
          name: 'voice',
          description: 'Speech Voice',
          ...I18n.optionLocalizations('commands.settings.set.tts_voice.voice'),
          onAutoComplete: Parameters.AutoComplete.ttsVoices,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.tts_voice.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetTTSVoice.CommandArgs) {
    return Formatter.Commands.SettingsSetTTSVoice.createMessage(context, args);
  }
}
