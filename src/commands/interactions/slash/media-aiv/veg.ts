import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'veg';

export interface CommandArgsBefore {
  cutoff?: boolean,
  url?: null | string,
  veg?: Structures.Attachment | string,
  vegUrl?: string,
}

export class MediaAIVVegCommand extends BaseInteractionMediaCommandOption {
  description = 'Play a Vegas project (.veg) with every one of its sources replaced by an Audio/Image/Video';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.veg.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationVeg.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.veg.name');

  constructor() {
    super({
      options: [
        {name: 'veg', description: 'Vegas project file (.veg)', ...I18n.optionLocalizations('commands.media_aiv.veg.veg'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'veg-url', description: 'Vegas project URL, instead of the file', ...I18n.optionLocalizations('commands.media_aiv.veg.veg_url'), label: 'vegUrl'},
        {name: 'cutoff', description: 'A clip that starts on a track cuts off the one before it (Default: True)', ...I18n.optionLocalizations('commands.media_aiv.veg.cutoff'), type: Boolean},
      ],
    }, {skipFiles: ['.veg']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getVegUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_veg_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getVegUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaAIVManipulationVeg.createMessage(context, {
      cutoff: args.cutoff,
      url: args.url!,
      veg: getVegUrl(args)!,
    });
  }
}


function getVegUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.veg instanceof Structures.Attachment) {
    return args.veg.url || args.veg.proxyUrl || null;
  }
  return args.vegUrl || null;
}
