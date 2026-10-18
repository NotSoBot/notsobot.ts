import { Command, Interaction, Structures } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagRandom } from '../../../api';
import { getTranslator } from '../../i18n';
import { Paginator, editOrReply } from '../../../utils';

import { generatePages, increaseUsage, maybeCheckNSFW, maybeReplaceContent, parseTag } from './tag.show';


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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const tag = await fetchTagRandom(context, {
    content: args.content,
    name: args.name,
    serverId: (context.guildId || context.channelId)!,
    userId: (args.user) ? args.user.id : undefined,
  });
  await increaseUsage(context, tag);

  // parse it
  const options: Command.EditOrReply = {content: ''};
  const title = translate('tag_random.showing_tag', {name: Markup.codestring(tag.name)});

  try {
    context.metadata = Object.assign({}, context.metadata, {tag});
    const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
    const parsedTag = await parseTag(context, tagContent, args.arguments);

    context.metadata = Object.assign({}, context.metadata, {parsedTag});
    await maybeReplaceContent(context, tag);
  
    if (parsedTag.pages.length) {
      const pages = generatePages(context, parsedTag);
      const paginator = new Paginator(context, {pages});
      return await paginator.start();
    }

    options.content = parsedTag.text.slice(0, 2000);

    if (parsedTag.embeds.length) {
      // add checks for embed lengths
      options.embeds = parsedTag.embeds.slice(0, 10);
    }

    if (parsedTag.files.length) {
      options.files = parsedTag.files.slice(0, 10).map((file) => {
        // tag.random can never be a voice message since the content will always be set
        return {
          description: file.description,
          durationSecs: file.durationSecs,
          filename: file.filename,
          hasSpoiler: file.spoiler,
          waveform: file.waveform,
          value: file.buffer,
        };
      });
    }

    await maybeCheckNSFW(context, options);
    if (!options.content.length && !parsedTag.embeds.length && !parsedTag.files.length) {
      options.content = translate('tag_random.tag_returned_no_content');
    }
  } catch(error) {
    options.content = error.message;
  }

  options.content = [
    title + '\n',
    options.content,
  ].join('\n').slice(0, 2000);

  return editOrReply(context, options);
}
