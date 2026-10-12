import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flies';

export class MediaIVOverlayFliesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay some flies on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.flies.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlies.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.flies.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Amount of Flies (1..100) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv.overlay.flies.amount'), type: Number},
        {name: 'degrees', description: 'Custom Fly Starting Angle (-360..360)', ...I18n.optionLocalizations('commands.media_iv.overlay.flies.degrees'), type: Number},
        {
          name: 'fly',
          description: 'Custom Fly Emoji/Media URL/User',
          ...I18n.optionLocalizations('commands.media_iv.overlay.flies.fly'),
          label: 'flyImage',
          value: Parameters.mediaUrl({audio: false, video: false, onlyContent: true}),
        },
        {name: 'speed', description: 'Fly Speed (0.01..1000.0) (Default: 10.0)', ...I18n.optionLocalizations('commands.media_iv.overlay.flies.speed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlies.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlies.createMessage(context, args);
  }
}
