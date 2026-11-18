import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wrap';

export class MediaIVWrapCommand extends BaseInteractionMediasCommandOption {
  description = 'Put a second media onto the first one\'s surface, bent over its shape and lit like it';
  descriptionLocalizations = I18n.localizations('commands.media_iv_scene.wrap.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWrap.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_scene.wrap.name');

  constructor() {
    super({
      options: [
        {
          name: 'size',
          description: 'Its width, of the shorter side, 0.05 to 2 (Default: 0.4)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.size'),
          maxValue: 2,
          minValue: 0.05,
          type: 'number',
        },
        {
          name: 'x',
          description: 'Where its center goes across, 0 (left) to 1 (right) (Default: 0.5)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.x'),
          maxValue: 1,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'y',
          description: 'Where its center goes down, 0 (top) to 1 (bottom) (Default: 0.5)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.y'),
          maxValue: 1,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'rotate',
          description: 'Degrees clockwise, on the surface (Default: 0)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.rotate'),
          maxValue: 360,
          minValue: -360,
          type: 'number',
        },
        {
          name: 'relief',
          description: 'How much it follows the surface\'s shape, 0 (flat) to 3 (Default: 0.6)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.relief'),
          maxValue: 3,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'light',
          description: 'How much of the surface\'s lighting it takes, 0 to 2 (Default: 1)',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.light'),
          maxValue: 2,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'noclip',
          description: 'Let it go past the surface\'s outline and sharp edges',
          ...I18n.optionLocalizations('commands.media_iv_scene.wrap.noclip'),
          type: Boolean,
        },
      ],
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWrap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWrap.createMessage(context, args);
  }
}
