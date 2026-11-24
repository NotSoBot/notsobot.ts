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
        {name: 'members', type: Formatter.Commands.SettingsServerSetAutoEmbed.membersParser},
        {name: 'screenshot', type: Formatter.Commands.SettingsServerSetAutoEmbed.screenshotParser},
        {name: 'text', type: Formatter.Commands.SettingsServerSetAutoEmbed.textParser},
      ],
      disableDm: true,
      label: 'args',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change which sites get auto-embedded: a message whose only link is to a post on one of them gets the media downloaded, like `download`, with `-text off` only the media without the post\'s text, and `-gallery pages` shows posts with more than one media one per page (premium servers). `-members off` stops premium members auto-embedding their own links here. `-screenshot on` draws text-only posts as a screenshot of the post (with the text on). A rule blocking `download` or `embed` stops it too',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on tiktok`,
          `${COMMAND_NAME} off facebook`,
          `${COMMAND_NAME} -text off`,
          `${COMMAND_NAME} -gallery pages`,
          `${COMMAND_NAME} -members off`,
          `${COMMAND_NAME} -screenshot on`,
        ],
        id: Formatter.Commands.SettingsServerSetAutoEmbed.COMMAND_ID,
        usage: '(<on|off> (<tiktok|instagram|x|reddit|bluesky|threads|facebook|pinterest|tumblr|streamable>)) (-gallery <gallery|pages|default>) (-members <on|off>) (-screenshot <on|off>) (-text <on|off>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.SettingsServerSetAutoEmbed.contentParser,
    });
  }

  async run(context: Command.Context, args: {args: Formatter.Commands.SettingsServerSetAutoEmbed.CommandArgs, gallery?: null | PostGalleryTypes, members?: boolean, screenshot?: boolean, text?: boolean}) {
    return Formatter.Commands.SettingsServerSetAutoEmbed.createMessage(context, {...args.args, gallery: args.gallery, members: args.members, screenshot: args.screenshot, text: args.text});
  }
}
