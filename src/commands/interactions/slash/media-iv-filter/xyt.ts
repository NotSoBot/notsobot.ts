import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'xyt';

export interface CommandArgsBefore {
  url?: null | string,
  xyt?: Structures.Attachment | string,
  xytUrl?: string,
}

export class MediaIVXytCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a VivaVideo filter or fx template (.xyt) to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.xyt.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationXyt.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.xyt.name');

  constructor() {
    super({
      options: [
        {name: 'xyt', description: 'VivaVideo template file (.xyt)', ...I18n.optionLocalizations('commands.media_iv_5.fun.xyt.xyt'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'xyt-url', description: 'VivaVideo template URL, instead of the file', ...I18n.optionLocalizations('commands.media_iv_5.fun.xyt.xyt_url'), label: 'xytUrl'},
      ],
    }, {skipFiles: ['.xyt']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getXytUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_xyt_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getXytUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaIVManipulationXyt.createMessage(context, {
      url: args.url!,
      xyt: getXytUrl(args)!,
    });
  }
}


function getXytUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.xyt instanceof Structures.Attachment) {
    return args.xyt.url || args.xyt.proxyUrl || null;
  }
  return args.xytUrl || null;
}
