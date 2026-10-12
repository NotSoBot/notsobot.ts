import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'transcribe-translate';

export class ToolsTranscribeTranslateCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Transcribe an Audio or Video File then translate it';
  descriptionLocalizations = I18n.localizations('commands.tools.transcribe_translate.description');
  metadata = {
    id: Formatter.Commands.ToolsTranscribeTranslate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.transcribe_translate.name');

  constructor() {
    super({
      options: [
        {name: 'to', description: 'Language to translate to', ...I18n.optionLocalizations('commands.tools.transcribe_translate.to'), default: DefaultParameters.locale, value: Parameters.locale},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsTranscribeTranslate.CommandArgs) {
    return Formatter.Commands.ToolsTranscribeTranslate.createMessage(context, {to: args.to, url: args.url});
  }
}
