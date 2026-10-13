import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'playing';

export class InfoPlayingCommand extends BaseInteractionCommandOption {
  description = 'List users in the current server that are playing a certain game';
  descriptionLocalizations = I18n.localizations('commands.info.playing.description');
  metadata = {
    id: Formatter.Commands.InfoPlaying.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.playing.name');

  constructor() {
    super({
      options: [
        {
          name: 'game',
          description: 'Game Name or Application ID',
          ...I18n.optionLocalizations('commands.info.playing.game'),
          label: 'text',
          required: true,
          value: Parameters.stringLowerCase(),
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPlaying.CommandArgsBefore) {
    // needs a cached server for presences, so DMs and user installed servers won't work
    return !!context.guild && !!args.text;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPlaying.CommandArgsBefore) {
    if (!context.guild) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`, ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPlaying.CommandArgs) {
    return Formatter.Commands.InfoPlaying.createMessage(context, args);
  }
}
