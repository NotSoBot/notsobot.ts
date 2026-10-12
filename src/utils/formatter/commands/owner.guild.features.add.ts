import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { addGuildFeature } from '../../../api';
import { getTranslator } from '../../i18n';
import { GuildFeatures } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  feature: GuildFeatures,
  guild?: Structures.Guild,
}

export interface CommandArgs {
  feature: GuildFeatures,
  guild: Structures.Guild,
}


export const COMMAND_ID = 'owner.guild.features.add';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { features } = await addGuildFeature(context, args.guild.id, args.feature);
  if (GuildSettingsStore.has(args.guild.id)) {
    GuildSettingsStore.get(args.guild.id)!.merge({features});
  }

  const feature = Markup.codestring(args.feature);
  const featuresText = features.map((x) => Markup.codestring(x)).join(', ');
  return editOrReply(context, translate('owner_guild_features_add.ok_added_to_guild_features_are_now', {feature: feature, featuresText: featuresText, guild: args.guild.id}));
}
