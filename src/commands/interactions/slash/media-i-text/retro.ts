import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'retro';

export class MediaIRetroCommand extends BaseInteractionCommandOption {
  description = 'Write text in an 80s retrowave style';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.retro.description');
  metadata = {
    id: Formatter.Commands.MediaICreateRetrowave.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.retro.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to overlay, use | to split it into lines (Max 3)',
          ...I18n.optionLocalizations('commands.media_i.fun.retro.text'),
          default: '',
          maxLength: 100,
          value: Parameters.string({maxLength: 100}),
        },
        {
          name: 'background',
          description: 'Background Style (Default: 5)',
          ...I18n.optionLocalizations('commands.media_i.fun.retro.background'),
          choices: [1, 2, 3, 4, 5].map((value) => ({name: String(value), value})),
          type: Number,
        },
        {
          name: 'text-style',
          description: 'Text Style (Default: 4)',
          ...I18n.optionLocalizations('commands.media_i.fun.retro.text_style'),
          choices: [1, 2, 3, 4].map((value) => ({name: String(value), value})),
          label: 'textStyle',
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateRetrowave.CommandArgs) {
    return Formatter.Commands.MediaICreateRetrowave.createMessage(context, args);
  }
}
