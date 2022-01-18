import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagRandom } from '../../../api';
import { TagFormatter, editOrReply } from '../../../utils';


export interface CommandArgs {
  arguments: Array<string>,
  content?: string,
  name?: string,
  user?: Structures.Member | Structures.User | Structures.UserWithBanner,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const tag = await fetchTagRandom(context, {
    content: args.content,
    name: args.name,
    serverId: (context.guildId || context.channelId)!,
    userId: (args.user) ? args.user.id : undefined,
  });


  // parse it
  const options: Command.EditOrReply = {content: ''};

  const content: Array<string> = [];
  {
    let title = `Showing tag: ${Markup.codestring(tag.name)}`;
    if (tag.global) {
      title = `${title} (Global)`;
    }
    content.push(title + '\n');
  }

  try {
    const parsedTag = await TagFormatter.parse(context, tag.content, args.arguments);

    content.push(parsedTag.text.slice(0, 4000));
    if (parsedTag.files.length) {
      options.files = parsedTag.files.map((file) => {
        return {filename: file.filename, hasSpoiler: file.spoiler, value: file.buffer};
      });
    }
    if (!parsedTag.text.length && !parsedTag.files.length) {
      content.push('tag returned no content lmao');
    }
  } catch(error) {
    content.push(error.message);
  }

  options.content = content.join('\n').slice(0, 4000);
  return editOrReply(context, options);
}
