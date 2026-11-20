import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, PostGalleryTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set autoembed';

export default class SetAutoEmbedCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set auto-embed'],
      args: [
        {name: 'gallery', type: Formatter.Commands.SettingsServerSetAutoEmbed.galleryParser},
        {name: 'text', type: Formatter.Commands.SettingsServerSetAutoEmbed.textParser},
      ],
      disableDm: true,
      label: 'args',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change which sites get auto-embedded: a message that\'s only a link to one of them gets the media downloaded, like `download`, with `-text on` the post\'s text too, and `-gallery pages` shows posts with more than one media one per page (premium servers)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on tiktok`,
          `${COMMAND_NAME} off facebook`,
          `${COMMAND_NAME} -text on`,
          `${COMMAND_NAME} -gallery pages`,
        ],
        id: Formatter.Commands.SettingsServerSetAutoEmbed.COMMAND_ID,
        usage: '(<on|off> (<tiktok|instagram|x|reddit|bluesky|threads|facebook|pinterest|tumblr|streamable>)) (-gallery <gallery|pages|default>) (-text <on|off>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.SettingsServerSetAutoEmbed.contentParser,
    });
  }

  async run(context: Command.Context, args: {args: Formatter.Commands.SettingsServerSetAutoEmbed.CommandArgs, gallery?: null | PostGalleryTypes, text?: boolean}) {
    return Formatter.Commands.SettingsServerSetAutoEmbed.createMessage(context, {...args.args, gallery: args.gallery, text: args.text});
  }
}
