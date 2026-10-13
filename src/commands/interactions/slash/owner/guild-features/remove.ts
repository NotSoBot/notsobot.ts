import { Interaction } from 'detritus-client';

import { GuildFeatures, StatusEmojis } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../base';


export const COMMAND_NAME = 'remove';

export class OwnerGuildFeaturesRemoveCommand extends BaseOwnerCommandOption {
  description = 'Remove a feature from a guild';
  descriptionLocalizations = I18n.localizations('commands.owner.guild_features.remove.description');
  metadata = {
    id: Formatter.Commands.OwnerGuildFeaturesRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.guild_features.remove.name');

  constructor() {
    super({
      options: [
        {
          name: 'feature',
          description: 'Guild Feature',
          ...I18n.optionLocalizations('commands.owner.guild_features.remove.feature'),
          choices: Parameters.Slash.oneOf({choices: GuildFeatures, localizationKey: 'choices.guild_features'}),
          required: true,
        },
        {name: 'guild', description: 'Guild ID (Default: Current Guild)', ...I18n.optionLocalizations('commands.owner.guild_features.remove.guild'), default: DefaultParameters.guild, value: Parameters.guild},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgs) {
    return Formatter.Commands.OwnerGuildFeaturesRemove.createMessage(context, args);
  }
}
