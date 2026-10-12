import { Interaction } from 'detritus-client';

import { GuildFeatures, StatusEmojis } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../base';


export const COMMAND_NAME = 'add';

export class OwnerGuildFeaturesAddCommand extends BaseOwnerCommandOption {
  description = 'Add a feature to a guild';
  descriptionLocalizations = I18n.localizations('commands.owner.guild_features.add.description');
  metadata = {
    id: Formatter.Commands.OwnerGuildFeaturesAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.guild_features.add.name');

  constructor() {
    super({
      options: [
        {
          name: 'feature',
          description: 'Guild Feature',
          ...I18n.optionLocalizations('commands.owner.guild_features.add.feature'),
          choices: Parameters.Slash.oneOf({choices: GuildFeatures, localizationKey: 'choices.guild_features'}),
          required: true,
        },
        {name: 'guild', description: 'Guild ID (Default: Current Guild)', ...I18n.optionLocalizations('commands.owner.guild_features.add.guild'), default: DefaultParameters.guild, value: Parameters.guild},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerGuildFeaturesAdd.CommandArgs) {
    return Formatter.Commands.OwnerGuildFeaturesAdd.createMessage(context, args);
  }
}
