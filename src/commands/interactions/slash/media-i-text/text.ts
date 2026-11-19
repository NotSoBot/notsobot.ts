import { Interaction } from 'detritus-client';

import { MediaTextAlignments, MediaTextAlignmentsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'text';

export class MediaITextCommand extends BaseInteractionCommandOption {
  description = 'Make a transparent image of some text';
  descriptionLocalizations = I18n.localizations('commands.media_i.text.description');
  metadata = {
    id: Formatter.Commands.MediaICreateText.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.text.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'The text',
          ...I18n.optionLocalizations('commands.media_i.text.text'),
          maxLength: 2000,
          value: Parameters.string({maxLength: 2000}),
          required: true,
        },
        {
          name: 'font',
          description: 'A bundled font (impact, arial, roboto...) or one of your saved fonts',
          ...I18n.optionLocalizations('commands.media_i.text.font'),
          maxLength: 64,
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'size',
          description: 'Font size in pixels, 1 to 500 (Default: 48)',
          ...I18n.optionLocalizations('commands.media_i.text.size'),
          maxValue: 500,
          minValue: 1,
          type: 'number',
        },
        {
          name: 'color',
          description: 'Text color, a name, #hex or r,g,b',
          ...I18n.optionLocalizations('commands.media_i.text.color'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'stroke',
          description: 'Outline color',
          ...I18n.optionLocalizations('commands.media_i.text.stroke'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'background',
          description: 'Color of a box behind the text',
          ...I18n.optionLocalizations('commands.media_i.text.background'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'align',
          description: 'How the lines line up (Default: Center)',
          ...I18n.optionLocalizations('commands.media_i.text.align'),
          choices: Parameters.Slash.oneOf({choices: MediaTextAlignments, descriptions: MediaTextAlignmentsToText, localizationKey: 'choices.media_text_alignments', defaultChoice: MediaTextAlignments.CENTER}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateText.CommandArgs) {
    return Formatter.Commands.MediaICreateText.createMessage(context, args);
  }
}
