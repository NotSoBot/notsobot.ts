import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'draw-text';

export class MediaIVTextDrawTextCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Write text onto an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.draw_text.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTextDraw.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.draw_text.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'The text',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.text'),
          maxLength: 2000,
          value: Parameters.string({maxLength: 2000}),
          required: true,
        },
        {
          name: 'x',
          description: 'Where it goes across, maths with w h tw th t (Default: centered)',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.x'),
          maxLength: 200,
          value: Parameters.string({maxLength: 200}),
        },
        {
          name: 'y',
          description: 'Where it goes down, maths with w h tw th t (Default: centered)',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.y'),
          maxLength: 200,
          value: Parameters.string({maxLength: 200}),
        },
        {
          name: 'font',
          description: 'A bundled font (impact, arial, roboto...) or one of your saved fonts',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.font'),
          maxLength: 64,
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'size',
          description: 'Font size in pixels, 1 to 500 (Default: 48)',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.size'),
          maxValue: 500,
          minValue: 1,
          type: 'number',
        },
        {
          name: 'color',
          description: 'Text color, a name, #hex or r,g,b',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.color'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'stroke',
          description: 'Outline color',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.stroke'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'background',
          description: 'Color of a box behind the text',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.background'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'start',
          description: 'Seconds of a video it starts showing at',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.start'),
          maxValue: 600,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'end',
          description: 'Seconds of a video it stops showing at',
          ...I18n.optionLocalizations('commands.media_iv_text.draw_text.end'),
          maxValue: 600,
          minValue: 0,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTextDraw.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTextDraw.createMessage(context, args);
  }
}
