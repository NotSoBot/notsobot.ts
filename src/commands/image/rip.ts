import { Command, CommandClient, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import { imageCreateTombstone } from '../../api';
import { RestOptions } from '../../api/types';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
}

export interface CommandArgs {
  text: string,
}

export const COMMAND_NAME = 'rip';

export default class RipCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Create a tombstone with some text',
        examples: [
          `${COMMAND_NAME} <@300505364032389122>`,
          `${COMMAND_NAME} <@300505364032389122> yup he dead`,
          `${COMMAND_NAME} yup he dead`,
        ],
        type: CommandTypes.IMAGE,
        usage:  '?<user:mention> ...?<text>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const parts = args.text.split(' ');
    const mention = parts.shift() as string;

    let username: string;
    const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, mention) as {matches: Array<{id: string}>};
    if (matches.length && context.message.mentions.has(matches[0].id)) {
      username = (context.message.mentions.get(matches[0].id) as Structures.User).username;
    } else {
      username = context.user.username;
      parts.unshift(mention);
    }
    const text = parts.join(' ');

    const query: RestOptions.ImageCreateTombstone = {line1: 'R.I.P'};
    if (text) {
      if (22 < text.length) {
        query.line4 = text.slice(0, 22);
        query.line5 = text.slice(22);
      } else {
        query.line4 = text;
      }
    } else {
      if (text.slice(-1).toLowerCase() !== 's') {
        username += '\'s';
      }
      query.line4 = 'Hopes and Dreams';
    }
    query.line2 = username;

    const response = await imageCreateTombstone(context, query);
    return imageReply(context, response);
  }
}
