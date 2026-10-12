import { Command, Interaction, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import { mediaICreateTombstone } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.tombstone';

export interface CommandArgs {
  text: string,
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const parts = args.text.split(' ');

  let username: string;
  if (args.user) {
    username = args.user.username;
  } else {
    const mention = parts.shift()!;
    const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, mention) as {matches: Array<{id: string}>};
    if (matches.length && context.users.has(matches[0].id)) {
      username = context.users.get(matches[0].id)!.username;
    } else {
      username = context.user.username;
      parts.unshift(mention);
    }
  }
  const text = parts.join(' ').trim();

  const query: RestOptions.MediaICreateTombstone = {
    line1: 'R.I.P',
    safe: DefaultParameters.safe(context),
  };
  if (text) {
    if (22 < text.length) {
      query.line4 = text.slice(0, 22);
      query.line5 = text.slice(22);
    } else {
      query.line4 = text;
    }
  } else {
    if (username.slice(-1).toLowerCase() !== 's') {
      username += '\'s';
    } else {
      username += '\'';
    }
    query.line4 = 'Hopes and Dreams';
  }
  query.line2 = username;

  const response = await mediaICreateTombstone(context, query);
  return mediaReply(context, response);
}
