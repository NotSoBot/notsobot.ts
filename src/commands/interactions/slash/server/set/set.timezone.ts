import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  clear?: boolean,
  timezone?: string | null,
}

export class ServerSetTimezoneCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s default timezone for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_timezone.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetTimezone.COMMAND_ID,
  };
  name = 'timezone';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_timezone.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to choose from',
          ...I18n.optionLocalizations('commands.settings_server.set.set_timezone.timezone'),
          onAutoComplete: Parameters.AutoComplete.timezone,
          // autocomplete gives the code, but anything can be typed in
          value: (value: string) => Parameters.timezone(value),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_timezone.clear'),
          type: Boolean,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return args.timezone !== null;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translateMaybe } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translateMaybe('params.unknown_timezone', 'Unknown timezone, try a city or an abbreviation like PST')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsServerSetTimezone.createMessage(context, args);
  }
}
