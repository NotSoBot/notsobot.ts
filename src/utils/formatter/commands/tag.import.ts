import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { postTagsImport } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';
import { Translator, getTranslator } from '../../i18n';


export const COMMAND_ID = 'tag.import';

export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export interface CommandArgs {
  url?: string | null,
}


// same people who can export/remove other people's tags here: they can import them too, and overwrite tags they don't own
export function canManageServerTags(context: Command.Context | Interaction.InteractionContext): boolean {
  if (context.user.isClientOwner) {
    return true;
  }
  if (context.member && context.member.canManageGuild) {
    return true;
  }
  // most likely a group dm, check to see if is owner of it
  return !!(context.inDm && context.channel && context.channel.ownerId === context.userId);
}


function createResultText(translator: Translator, result: RestResponsesRaw.PostTagsImport): string {
  const { language, translate } = translator;
  const number = (value: number) => value.toLocaleString(language);

  const lines: Array<string> = [];
  if (result.overwritten) {
    lines.push(translate('tag_import.overwritten', {count: number(result.overwritten)}));
  } else {
    lines.push(translate('tag_import.imported', {imported: number(result.imported), total: number(result.total)}));
  }

  if (result.conflicts.length) {
    lines.push(`- ${translate('tag_import.skipped_conflicts', {count: number(result.conflicts.length)})}`);
    const overwritable = result.conflicts.filter((conflict) => conflict.can_overwrite).length;
    if (overwritable) {
      lines.push(`  - ${translate('tag_import.skipped_conflicts_overwritable', {count: number(overwritable)})}`);
    }
  }
  if (result.skipped.not_yours) {
    lines.push(`- ${translate('tag_import.skipped_not_yours', {count: number(result.skipped.not_yours)})}`);
  }
  if (result.skipped.limit) {
    lines.push(`- ${translate('tag_import.skipped_limit', {count: number(result.skipped.limit)})}`);
  }
  if (result.skipped.missing_reference) {
    lines.push(`- ${translate('tag_import.skipped_missing_reference', {count: number(result.skipped.missing_reference)})}`);
  }
  if (result.skipped.invalid) {
    lines.push(`- ${translate('tag_import.skipped_invalid', {count: number(result.skipped.invalid)})}`);
  }
  return lines.join('\n');
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  if (!args.url) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_import.needs_file')}`});
  }

  const url = args.url;
  const serverId = context.guildId || context.channelId!;
  const canManage = canManageServerTags(context);
  const importOptions = {canManage, guildId: context.guildId || null, url};

  // the api checks the export's signature, so only unmodified notsobot exports get imported
  const result = await postTagsImport(context, serverId, importOptions);

  const overwritable = result.conflicts.filter((conflict) => conflict.can_overwrite).map((conflict) => conflict.name);
  if (!overwritable.length) {
    return displayReply(context, {description: createResultText(translator, result)});
  }

  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // drop the button, the result stays
        components.clear();
        await displayReply(context, {components, description: createResultText(translator, result)});
      } catch(e) {

      }
    },
  });

  let overwritten = false;
  components.createButton({
    label: translate('tag_import.overwrite', {count: overwritable.length.toLocaleString(language)}),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId || overwritten) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      overwritten = true;
      components.clear();

      // the api checks again that each of these can be overwritten by this user
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      const overwriteResult = await postTagsImport(context, serverId, {...importOptions, overwrite: overwritable});
      return displayReply(context, {
        components,
        description: [
          createResultText(translator, result),
          '',
          createResultText(translator, overwriteResult),
        ].join('\n'),
      });
    },
  });

  return displayReply(context, {components, description: createResultText(translator, result)});
}
