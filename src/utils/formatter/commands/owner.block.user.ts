import { Command, Interaction } from 'detritus-client';

import UserStore from '../../../stores/users';
import { getTranslator, Translator } from '../../i18n';

import { editUser } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { Parameters, createUserString, displayReply, displayTimestamp } from '../../../utils';


export interface CommandArgsBefore {
  duration?: number,
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  duration?: number,
  payload: Parameters.BanPayloadMembersOnly,
}


export const COMMAND_ID = 'owner.block.user';

// the api's limits for a timed block, in seconds
export const BLOCK_MIN_DURATION = 60;
export const BLOCK_MAX_DURATION = 5 * 365 * 24 * 60 * 60;

// when a block with this duration ends, null for permanent (no duration), undefined when it's out of range
export function getBlockedUntil(duration?: number | null): Date | null | undefined {
  if (duration === undefined || duration === null) {
    return null;
  }
  if (duration < BLOCK_MIN_DURATION || BLOCK_MAX_DURATION < duration) {
    return undefined;
  }
  return new Date(Date.now() + duration * 1000);
}

export function displayBlockedUntil(translate: Translator['translate'], until: Date | string | null): string {
  return (until) ? ' ' + translate('blocked.until', {time: displayTimestamp(until)}) : '';
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const until = getBlockedUntil(args.duration);
  if (until === undefined) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('owner_block.invalid_duration')}`});
  }

  const users: Array<string> = [];
  for (let memberOrUser of args.payload.membersOrUsers) {
    await UserStore.getOrFetch(context, memberOrUser.id);
    await editUser(context, memberOrUser.id, {
      blocked: true,
      blockedReason: args.payload.text,
      // sent either way, so blocking someone again without one makes it permanent
      blockedUntil: (until) ? until.toISOString() : null,
    });
    users.push(createUserString(memberOrUser.id, memberOrUser));
  }

  let content: string = translate('owner_block_user.successfully_blocked', {users: users.join(', ')});
  if (args.payload.text) {
    content = translate('owner_block_user.reason', {content: content, text: args.payload.text});
  }
  return displayReply(context, {description: content + displayBlockedUntil(translate, until)});
}
