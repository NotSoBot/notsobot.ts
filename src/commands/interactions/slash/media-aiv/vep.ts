import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vep';

export interface CommandArgsBefore {
  url?: null | string,
  vep?: Structures.Attachment | string,
  vepUrl?: string,
}

export class MediaAIVVepCommand extends BaseInteractionMediaCommandOption {
  description = 'Play an AVS Video Editor project (.vep) with all of its sources replaced by an Audio/Image/Video';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.vep.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationVep.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.vep.name');

  constructor() {
    super({
      options: [
        {name: 'vep', description: 'AVS Video Editor project file (.vep)', ...I18n.optionLocalizations('commands.media_aiv.vep.vep'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'vep-url', description: 'AVS Video Editor project URL, instead of the file', ...I18n.optionLocalizations('commands.media_aiv.vep.vep_url'), label: 'vepUrl'},
      ],
    }, {skipFiles: ['.vep']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getVepUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_vep_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getVepUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaAIVManipulationVep.createMessage(context, {
      url: args.url!,
      vep: getVepUrl(args)!,
    });
  }
}


function getVepUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.vep instanceof Structures.Attachment) {
    return args.vep.url || args.vep.proxyUrl || null;
  }
  return args.vepUrl || null;
}
