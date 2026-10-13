import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import TagCustomCommandsStore from '../../../stores/tagcustomcommands';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.commandify.disable';

export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const tag = await editTag(context, args.tag.id, {isCommand: false});

  const payloadId = context.guildId || context.userId;
  if (TagCustomCommandsStore.has(payloadId)) {
    TagCustomCommandsStore.get(payloadId)!.delete(tag.id);
  }

  return displayReply(context, {description: translate('tag_commands_remove.successfully_removed_the_tag_from_the_custom', {name: Markup.codestring(tag.name)})});
}
