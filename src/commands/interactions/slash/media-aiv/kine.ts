import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'kine';

export interface CommandArgsBefore {
  kine?: Structures.Attachment | string,
  kineUrl?: string,
  url?: null | string,
}

export class MediaAIVKineCommand extends BaseInteractionMediaCommandOption {
  description = 'Play a KineMaster project (.kine) with all of its media replaced by an Audio/Image/Video';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.kine.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationKine.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.kine.name');

  constructor() {
    super({
      options: [
        {name: 'kine', description: 'KineMaster project file (.kine)', ...I18n.optionLocalizations('commands.media_aiv.kine.kine'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'kine-url', description: 'KineMaster project URL, instead of the file', ...I18n.optionLocalizations('commands.media_aiv.kine.kine_url'), label: 'kineUrl'},
      ],
    }, {skipFiles: ['.kine']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getKineUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_kine_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getKineUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaAIVManipulationKine.createMessage(context, {
      kine: getKineUrl(args)!,
      url: args.url!,
    });
  }
}


function getKineUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.kine instanceof Structures.Attachment) {
    return args.kine.url || args.kine.proxyUrl || null;
  }
  return args.kineUrl || null;
}
