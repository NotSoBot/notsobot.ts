import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ocr-translate';

export class ToolsOCRTranslateCommand extends BaseInteractionImageCommandOption {
  description = 'Read text inside of an Image and translate it';
  descriptionLocalizations = I18n.localizations('commands.tools.ocr_translate.description');
  metadata = {
    id: Formatter.Commands.ToolsOCRTranslate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.ocr_translate.name');

  constructor() {
    super({
      options: [
        {name: 'to', description: 'Language to translate to', ...I18n.optionLocalizations('commands.tools.ocr_translate.to'), default: DefaultParameters.locale, value: Parameters.locale},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsOCRTranslate.CommandArgs) {
    return Formatter.Commands.ToolsOCRTranslate.createMessage(context, {to: args.to, url: args.url});
  }
}
