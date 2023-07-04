import { Command, Interaction } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import { mediaICreateTombstone } from '../../../api';
import { RestOptions } from '../../../api/types';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.tombstone';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const parts = args.text.split(' ');
  const mention = parts.shift()!;

  let username: string;
  const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, mention) as {matches: Array<{id: string}>};
  if (matches.length && context.users.has(matches[0].id)) {
    username = context.users.get(matches[0].id)!.username;
  } else {
    username = context.user.username;
    parts.unshift(mention);
  }
  const text = parts.join(' ');

  const query: RestOptions.MediaICreateTombstone = {line1: 'R.I.P'};
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

  const response = await mediaICreateTombstone(context, query);
  return imageReply(context, response);
}
