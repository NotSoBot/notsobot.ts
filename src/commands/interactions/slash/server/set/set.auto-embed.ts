import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildAutoEmbedSitesToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetAutoEmbedCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'See or change which sites\' links get auto-embedded (premium servers)';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_auto_embed.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetAutoEmbed.COMMAND_ID,
  };
  name = 'auto-embed';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_auto_embed.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'embed',
          description: 'Post the media of links to posts, like download (Default: off)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_auto_embed.embed'),
          type: Boolean,
        },
        {
          name: 'gallery',
          description: 'How posts with more than one media show (Default: each poster\'s setting)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_auto_embed.gallery'),
          choices: Parameters.Slash.AUTO_EMBED_GALLERY,
          value: Formatter.Commands.SettingsServerSetAutoEmbed.galleryParser,
        },
        {
          name: 'members',
          description: 'Let premium members auto-embed their own links (Default: on)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_auto_embed.members'),
          type: Boolean,
        },
        {
          name: 'site',
          description: 'Only turn this site on or off (Default: all of them)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_auto_embed.site'),
          // brand names, not translated
          choices: Formatter.Commands.SettingsServerSetAutoEmbed.SITES.map((x) => {
            return Parameters.Slash.createChoice(GuildAutoEmbedSitesToText[x.site], x.site);
          }),
          value: Formatter.Commands.SettingsServerSetAutoEmbed.siteSlashParser,
        },
        {
          name: 'text',
          description: 'The post\'s text with the media, Screenshot draws text-only posts as an image (Default: Text)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_auto_embed.text'),
          choices: Parameters.Slash.AUTO_EMBED_TEXT,
          label: 'textMode',
          value: Formatter.Commands.SettingsServerSetAutoEmbed.textModeSlashParser,
        },
      ],
    });
  }

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.SettingsServerSetAutoEmbed.CommandArgs & {textMode?: Formatter.Commands.SettingsServerSetAutoEmbed.AutoEmbedTextModes},
  ) {
    const { textMode, ...rest } = args;
    return Formatter.Commands.SettingsServerSetAutoEmbed.createMessage(context, {
      ...rest,
      ...Formatter.Commands.SettingsServerSetAutoEmbed.textModeToArgs(textMode),
    });
  }
}
