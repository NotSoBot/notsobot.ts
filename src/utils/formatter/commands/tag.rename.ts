import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.rename';

export interface CommandArgsBefore {
  name: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  name: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.tag.name === args.name) {
    return displayReply(context, {description: 'ok'});
  }

  const tag = await editTag(context, args.tag.id, {name: args.name});
  return displayReply(context, {description: translate('tag_rename.successfully_renamed_tag_to', {name: Markup.codestring(args.tag.name), name2: Markup.codestring(tag.name)})});
}
