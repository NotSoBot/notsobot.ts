import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { createUserWarning } from '../../../api';
import { UserWarningPending } from '../../../api/structures/user';
import UserStore from '../../../stores/users';
import { getTranslator, Translator } from '../../i18n';
import { createUserString, displayReply, displayTimestamp } from '../../../utils';


export interface CommandArgs {
  reason: string,
  users: Array<Structures.Member | Structures.User>,
}


export const COMMAND_ID = 'owner.warn';

// discord's message limit, with room for the title and footer
const NOTICE_MAX_LENGTH = 1800;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const description: Array<string> = [];
  for (let user of args.users) {
    // the api needs to know them to warn them
    await UserStore.getOrFetch(context, user.id);
    const { count, warning } = await createUserWarning(context, user.id, {reason: args.reason});
    let line = translate('owner_warn.warned', {count: count.toLocaleString(), user: createUserString(user.id, user)});
    if (!warning.dm_sent) {
      line = `${line} ${translate('owner_warn.dm_failed')}`;
    }
    description.push(line);
  }
  return displayReply(context, {description: description.join('\n')});
}


// the staff warnings shown in place of someone's next command, oldest first. as many as fit (one always does, a reason
// is at most 1000 characters), the rest wait for the command after
export function createUserWarningsNotice(
  translate: Translator['translate'],
  warnings: Array<UserWarningPending>,
): {content: string, warningIds: Array<string>} {
  const blocks: Array<string> = [];
  const warningIds: Array<string> = [];
  let length = 0;
  for (let warning of warnings) {
    const reason = warning.reason || translate('moderation.unspecified_reason');
    const quote = reason.split('\n').map((line) => `> ${line}`).join('\n');
    const block = `${quote}\n-# ${displayTimestamp(warning.created)}`;
    if (blocks.length && NOTICE_MAX_LENGTH < length + block.length) {
      break;
    }
    blocks.push(block);
    warningIds.push(warning.id);
    length += block.length;
  }
  const content = [
    Markup.bold(translate('blocked.warning')),
    ...blocks,
    translate('blocked.warning_footer'),
  ].join('\n');
  return {content, warningIds};
}
