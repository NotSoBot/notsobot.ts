import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag, editTagsDirectoryTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.directory.edit';

export interface CommandArgsBefore {
  content?: string,
  description?: string,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  content?: string,
  description?: string,
  tag: RestResponsesRaw.Tag,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const description: Array<string> = ['Ok, updated'];
  if (args.content) {
    if (args.content === args.tag.content) {
      description.push('- Tag already has that content');
    } else {
      description.push('- Tag\'s content has been updated.');
      await editTag(context, args.tag.id, {content: args.content});
    }
  }

  if (args.description || args.title) {
    // just force update it
    const directory = await editTagsDirectoryTag(context, args.tag.id, {
      description: args.description,
      title: args.title,
    });
    if (args.title) {
      description.push('- Tag\'s directory title has been updated.');
    }
    if (args.description) {
      description.push('- Tag\'s directory description has been updated.');
    }
  }

  return editOrReply(context, description.join('\n'));
}
