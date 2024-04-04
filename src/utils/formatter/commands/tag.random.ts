import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagRandom } from '../../../api';
import { TagFormatter, editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.random';

export interface CommandArgs {
  arguments?: string,
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
    content.push(title + '\n');
  }

  try {
    context.metadata = Object.assign({}, context.metadata, {tag});
    const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
    const parsedTag = await TagFormatter.parse(context, tagContent, args.arguments);

    content.push(parsedTag.text.slice(0, 2000));
    if (parsedTag.embeds.length) {
      // add checks for embed lengths
      options.embeds = parsedTag.embeds.slice(0, 10);
    }
    if (parsedTag.files.length) {
      options.files = parsedTag.files.slice(0, 10).map((file) => {
        return {filename: file.filename, hasSpoiler: file.spoiler, value: file.buffer};
      });
    }
    if (!parsedTag.text.length && !parsedTag.embeds.length && !parsedTag.files.length) {
      content.push('Tag returned no content');
    }

    context.metadata = Object.assign({}, context.metadata, {parsedTag});
  } catch(error) {
    content.push(error.message);
  }

  options.content = content.join('\n').slice(0, 2000);

  return editOrReply(context, options);
}
