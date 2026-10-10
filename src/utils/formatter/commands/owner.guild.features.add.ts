import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { addGuildFeature } from '../../../api';
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
  const { features } = await addGuildFeature(context, args.guild.id, args.feature);
  if (GuildSettingsStore.has(args.guild.id)) {
    GuildSettingsStore.get(args.guild.id)!.merge({features});
  }

  const feature = Markup.codestring(args.feature);
  const featuresText = features.map((x) => Markup.codestring(x)).join(', ');
  return editOrReply(context, `Ok, added ${feature} to guild \`${args.guild.id}\`. Features are now ${featuresText}`);
}
