import { Interaction } from 'detritus-client';
import { Embed } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../../../constants';
import { Formatter, editOrReply } from '../../../../../utils';

import GuildSettingsStore from '../../../../../stores/guildsettings';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SettingsPrefixesListCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Prefixes';
  name = 'list';

  async run(context: Interaction.InteractionContext) {
    const guildId = context.guildId as string;

    const embed = new Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle('Showing prefixes');

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      Formatter.Commands.SettingsPrefixesList.formatPrefixes(context, settings.prefixes, embed);
    }

    return editOrReply(context, {embed});
  }
}
