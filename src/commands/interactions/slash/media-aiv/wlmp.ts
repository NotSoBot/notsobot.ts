import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wlmp';

export interface CommandArgsBefore {
  url?: null | string,
  wlmp?: Structures.Attachment | string,
  wlmpUrl?: string,
}

export class MediaAIVWlmpCommand extends BaseInteractionMediaCommandOption {
  description = 'Play a Movie Maker project (.wlmp) with every one of its sources replaced by an Audio/Image/Video';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.wlmp.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationWlmp.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.wlmp.name');

  constructor() {
    super({
      options: [
        {name: 'wlmp', description: 'Movie Maker project file (.wlmp)', ...I18n.optionLocalizations('commands.media_aiv.wlmp.wlmp'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'wlmp-url', description: 'Movie Maker project URL, instead of the file', ...I18n.optionLocalizations('commands.media_aiv.wlmp.wlmp_url'), label: 'wlmpUrl'},
      ],
    }, {skipFiles: ['.wlmp']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getWlmpUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_wlmp_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getWlmpUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaAIVManipulationWlmp.createMessage(context, {
      url: args.url!,
      wlmp: getWlmpUrl(args)!,
    });
  }
}


function getWlmpUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.wlmp instanceof Structures.Attachment) {
    return args.wlmp.url || args.wlmp.proxyUrl || null;
  }
  return args.wlmpUrl || null;
}
