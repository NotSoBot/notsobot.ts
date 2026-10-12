import { Interaction } from 'detritus-client';

import { CodeLanguages } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply, getCodeLanguage } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  code: string,
  language?: string,
}

export const COMMAND_NAME = 'code';

export class ToolsCodeCommand extends BaseInteractionCommandOption {
  description = 'Execute code';
  descriptionLocalizations = I18n.localizations('commands.tools.code.description');
  metadata = {
    id: Formatter.Commands.ToolsCode.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.code.name');

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to execute (a codeblock language is also detected)', ...I18n.optionLocalizations('commands.tools.code.code'), required: true},
        {name: 'language', description: 'Language to run the code as', ...I18n.optionLocalizations('commands.tools.code.language')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    let language: CodeLanguages | null = null;
    let version: string | null = null;

    if (args.language) {
      const parsed = getCodeLanguage(args.language);
      if (parsed) {
        language = parsed.language;
        version = parsed.version;
      }
    }

    const codeblock = Parameters.codeblock(args.code);
    if (!language && codeblock.language) {
      const parsed = getCodeLanguage(codeblock.language);
      if (parsed) {
        language = parsed.language;
        version = parsed.version;
      }
    }

    if (!language) {
      const { translate } = await I18n.getTranslator(context);
      return editOrReply(context, translate('tools.code.invalid_language', {languages: Formatter.Commands.ToolsCode.languagesText}));
    }

    return Formatter.Commands.ToolsCode.createMessage(context, {code: codeblock.text, language, version});
  }
}
