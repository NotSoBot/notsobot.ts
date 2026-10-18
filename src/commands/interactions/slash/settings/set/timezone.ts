import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  clear?: boolean,
  timezone?: string | null,
}

export class SettingsSetTimezoneCommand extends BaseInteractionCommandOption {
  description = 'Set your default timezone for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings.set.timezone.description');
  metadata = {
    id: Formatter.Commands.SettingsSetTimezone.COMMAND_ID,
  };
  name = 'timezone';
  nameLocalizations = I18n.localizations('commands.settings.set.timezone.name');

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Type a city, abbreviation or offset to search (e.g. tokyo, EST, GMT+09)',
          ...I18n.optionLocalizations('commands.settings.set.timezone.timezone'),
          onAutoComplete: Parameters.AutoComplete.timezone,
          // autocomplete gives the code, but anything can be typed in
          value: (value: string) => Parameters.timezone(value),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.timezone.clear'),
          type: Boolean,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    // a timezone was given but didn't match any we support
    return !!args.clear || args.timezone !== null;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('params.unknown_timezone')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsSetTimezone.createMessage(context, args);
  }
}
