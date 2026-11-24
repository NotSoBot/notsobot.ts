import { Interaction } from 'detritus-client';

import { GuildAutoEmbedSitesToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAutoEmbedCommand extends BaseInteractionCommandOption {
  description = 'See or change which sites your own links get auto-embedded for (premium)';
  descriptionLocalizations = I18n.localizations('commands.settings.set.auto_embed.description');
  metadata = {
    id: Formatter.Commands.SettingsSetAutoEmbed.COMMAND_ID,
  };
  name = 'auto-embed';
  nameLocalizations = I18n.localizations('commands.settings.set.auto_embed.name');

  constructor() {
    super({
      options: [
        {
          name: 'embed',
          description: 'Post the media of your links to posts, like download (Default: off)',
          ...I18n.optionLocalizations('commands.settings.set.auto_embed.embed'),
          type: Boolean,
        },
        {
          name: 'screenshot',
          description: 'Draw text-only posts as a screenshot of the post (Default: off)',
          ...I18n.optionLocalizations('commands.settings.set.auto_embed.screenshot'),
          type: Boolean,
        },
        {
          name: 'site',
          description: 'Only turn this site on or off (Default: all of them)',
          ...I18n.optionLocalizations('commands.settings.set.auto_embed.site'),
          // brand names, not translated
          choices: Formatter.Commands.SettingsServerSetAutoEmbed.SITES.map((x) => {
            return Parameters.Slash.createChoice(GuildAutoEmbedSitesToText[x.site], x.site);
          }),
          value: Formatter.Commands.SettingsServerSetAutoEmbed.siteSlashParser,
        },
        {
          name: 'text',
          description: 'Post the post\'s text and author with the media too (Default: on)',
          ...I18n.optionLocalizations('commands.settings.set.auto_embed.text'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAutoEmbed.CommandArgs) {
    return Formatter.Commands.SettingsSetAutoEmbed.createMessage(context, args);
  }
}
