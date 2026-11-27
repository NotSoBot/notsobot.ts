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
        {name: 'text', type: Formatter.Commands.SettingsServerSetAutoEmbed.textParser},
      ],
      disableDm: true,
      label: 'args',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change which sites get auto-embedded: a message whose only link is to a post on one of them gets the media downloaded, like `download`, `-text off` posts only the media without the post\'s text and `-text screenshot` draws text-only posts as a picture of the post, and `-gallery pages` shows posts with more than one media one per page (premium servers). `-members off` stops premium members auto-embedding their own links here. A rule blocking `download` or `embed` stops it too',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on tiktok`,
          `${COMMAND_NAME} off facebook`,
          `${COMMAND_NAME} -text off`,
          `${COMMAND_NAME} -text screenshot`,
          `${COMMAND_NAME} -gallery pages`,
          `${COMMAND_NAME} -members off`,
        ],
        id: Formatter.Commands.SettingsServerSetAutoEmbed.COMMAND_ID,
        usage: '(<on|off> (<tiktok|instagram|x|reddit|bluesky|threads|facebook|pinterest|tumblr|streamable>)) (-gallery <gallery|pages|default>) (-members <on|off>) (-text <text|screenshot|off>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.SettingsServerSetAutoEmbed.contentParser,
    });
  }

  async run(context: Command.Context, args: {args: Formatter.Commands.SettingsServerSetAutoEmbed.CommandArgs, gallery?: null | PostGalleryTypes, members?: boolean, text?: Formatter.Commands.SettingsServerSetAutoEmbed.AutoEmbedTextModes}) {
    return Formatter.Commands.SettingsServerSetAutoEmbed.createMessage(context, {
      ...args.args,
      ...Formatter.Commands.SettingsServerSetAutoEmbed.textModeToArgs(args.text),
      gallery: args.gallery,
      members: args.members,
    });
  }
}
