import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  bait?: boolean,
  clean?: number | null,
  interval?: number,
  topic?: string,
}

export class ServerDecoySettingsCommand extends BaseInteractionCommandOption {
  permissionsIgnoreClientOwner = false;

  description = 'Change how the decoy channel works';
  descriptionLocalizations = I18n.localizations('commands.decoy.settings.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID_SETTINGS,
  };
  name = 'settings';
  nameLocalizations = I18n.localizations('commands.decoy.settings.name');
  permissions = [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS];

  constructor() {
    super({
      options: [
        {
          name: 'clean',
          description: 'How far back their messages get deleted, like 1d, none, or default for the server\'s ban setting',
          ...I18n.optionLocalizations('commands.decoy.settings.clean'),
          value: Formatter.Commands.ServerDecoy.cleanParser,
        },
        {
          name: 'bait',
          description: 'Post and delete a message now and then so the channel looks used',
          ...I18n.optionLocalizations('commands.decoy.settings.bait'),
          type: ApplicationCommandOptionTypes.BOOLEAN,
        },
        {
          name: 'interval',
          description: 'About how often the bait posts, like 40m or 2h (10 minutes to 1 day)',
          ...I18n.optionLocalizations('commands.decoy.settings.interval'),
          value: Formatter.Commands.ServerDecoy.intervalParser,
        },
        {
          name: 'topic',
          description: 'The channel\'s topic, or none to clear it',
          ...I18n.optionLocalizations('commands.decoy.settings.topic'),
          maxLength: Formatter.Commands.ServerDecoy.TOPIC_MAX_LENGTH,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createSettingsMessage(context, args);
  }
}
