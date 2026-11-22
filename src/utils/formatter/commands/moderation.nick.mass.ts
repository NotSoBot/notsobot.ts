import { Command, Interaction, Structures } from 'detritus-client';
import { INTERACTION_TIMEOUT, InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { EmbedColors, StatusEmojis } from '../../../constants';
import { captureCommandError } from '../../../sentry';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { Confirmer } from '../../confirmer';
import { DisplayPayload, I18n, displayReply, formatUserForAuditLog, renderDisplay, renderEphemeralDisplay } from '../../../utils';

import * as ModerationNick from './moderation.nick';


export const COMMAND_ID = 'moderation.nick.mass';

// 404 is a member that left during the run (these take minutes), it shouldn't stop everyone after them
export const ERROR_CODES_IGNORE = [400, 403, 404];
export const MAX_MEMBERS = 5000;
export const MAX_NICKNAME_LENGTH = 32;
export const MAX_TIME_TO_RESPOND = 60 * 1000;
export const RATELIMIT_TIME = [10, 10]; // 10 members per 10 seconds (use a constant incase it changes in the future)

// how long a run's Refresh/Stop buttons keep working: twice the estimate (ratelimits, slow responses) plus the usual 15
// minutes, the run can't be stopped without them
export function progressTimeout(count: number): number {
  const [ amount, time ] = RATELIMIT_TIME;
  return Math.round((count / amount) * time * 1000 * 2) + INTERACTION_TIMEOUT;
}

// a run past its confirmation, from Continue until it ends: it went through everyone, Stop, `nick-mass cancel`, or an
// error it can't get past. It holds the server's `isExecuting.nick` the whole time and only its own end lets that go
//   (confirmer) pending -> running -> done
// the loop checks `isRunning` rather than the shared flag, after a Stop a newer run can hold the flag again while the old
// loop still waits on its last edit (it used to carry on next to the new one, and clear the new one's lock when it ended)
export interface NickMassRun {
  // false when it had already ended
  end: () => boolean,
  isRunning: () => boolean,
}

// the run going in each server, for `nick-mass cancel`. kept on the process instead of this module (like metrics.ts): a
// `.refresh` reloads this file while a run goes on under the old copy, the reloaded `nick-mass cancel` has to find it
const NICK_MASS_RUNS_KEY = 'notsobotNickMassRuns';
const runs: Map<string, () => boolean> = (globalThis as any)[NICK_MASS_RUNS_KEY] || ((globalThis as any)[NICK_MASS_RUNS_KEY] = new Map());

// null when the server already has one going (or the prompt was already answered)
export function startNickMassRun(guildId: string, confirmer: Confirmer): NickMassRun | null {
  const isExecuting = ServerExecutionsStore.getOrCreate(guildId);
  if (isExecuting.nick || !confirmer.transition('pending', 'running')) {
    return null;
  }
  isExecuting.nick = true;
  const end = (): boolean => {
    if (!confirmer.transition('running', 'done')) {
      return false;
    }
    isExecuting.nick = false;
    if (runs.get(guildId) === end) {
      runs.delete(guildId);
    }
    return true;
  };
  runs.set(guildId, end);
  return {end, isRunning: () => confirmer.state === 'running'};
}

// `nick-mass cancel`, the same as pressing the run's Stop (its progress message ends up showing it stopped)
export function stopNickMassRun(guildId: string): boolean {
  const end = runs.get(guildId);
  return !!end && end();
}

export interface CommandArgsBefore {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}

export interface CommandArgs {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await I18n.getTranslator(context);
  const guild = context.guild!;
  const me = guild.me!;

  const script = ModerationNick.createNicknameScript(context, args.text);
  const { isScript } = script;
  const nick = script.text;
  const createNickname = async (member: Structures.Member): Promise<string> => {
    return (await script.render(member)).slice(0, MAX_NICKNAME_LENGTH).trim();
  };

  // the person running it has to outrank them too, not just the bot (this let someone with a low role rename admins)
  const invoker = context.member;
  const canInvokerEdit = (member: Structures.Member) => {
    return !!invoker && (invoker.isOwner || invoker.id === member.id || invoker.canEdit(member));
  };

  const members = guild.members.filter((member) => {
    if (args.nobots && member.bot) {
      return false;
    }
    if (args.nousers && !member.bot) {
      return false;
    }
    if (args.role && !member.roles.has(args.role.id)) {
      return false;
    }
    // a script can come out different for each member, those get skipped when they run instead
    return (isScript || member.name !== nick) && me.canEdit(member) && canInvokerEdit(member);
  });

  // run it once now so a blocked function or a broken script errors before anyone presses continue
  if (isScript && members.length) {
    try {
      await createNickname(members[0]);
    } catch(error) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('nickmass.invalid_nickname', {error: String((error as Error).message || error)})}`});
    }
  }

  const [ amount, time ] = RATELIMIT_TIME;

  const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
  if (isExecuting.nick) {
    return displayReply(context, {description: translate('nickmass.in_progress')});
  }

  if (members.length) {
    const payload: DisplayPayload = {fields: []};
    payload.color = EmbedColors.DEFAULT;
    payload.title = translate('nickmass.can_edit', {count: members.length.toLocaleString(language), total: guild.members.length.toLocaleString(language)});
    payload.description = translate('nickmass.estimate', {seconds: ((members.length / amount) * time).toLocaleString(language)});

    // continue only runs once, a second click (or its expiry) mustn't run or cover it again. Stop only acts while this
    // prompt's run is going, Stop on an old progress message used to stop a later run in the server (they share `isExecuting`)
    const confirmer = new Confirmer(context);
    const components = new Components({timeout: 5 * (60 * 1000)});
    components.createButton({
      label: translate('common.continue'),
      style: MessageComponentButtonStyles.DANGER,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        if (confirmer.state !== 'pending') {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }
        // checked again here, two prompts could both be continued and rename everyone twice at the same time
        if (isExecuting.nick) {
          return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(ctx, {translate}, {
            description: translate('nickmass.in_progress'),
          }));
        }
        const run = startNickMassRun(guild.id, confirmer);
        if (!run) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const amounts = {
          changed: 0,
          failed: 0,
          skipped: 0,
        };
        const errors: Array<any> = [];
        // in the server's language since the whole server sees it
        const reason = I18n.getCachedGuildTranslator(context).translate('nickmass.audit_reason', {user: formatUserForAuditLog(context.user)});

        // read fresh each time, a Stop (or `nick-mass cancel`) ends it while the loop below awaits
        const { end, isRunning } = run;
        const countFinished = () => amounts.changed + amounts.skipped + amounts.failed + errors.length;
        const describe = (headerKey: 'nickmass.cancelled' | 'nickmass.finished'): Array<string> => {
          const finished = countFinished();
          const description: Array<string> = [];
          description.push(translate(headerKey, {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
          if (finished) {
            if (amounts.changed) {
              description.push(translate('nickmass.changed', {count: amounts.changed.toLocaleString(language)}));
            }
            if (amounts.skipped) {
              description.push(translate('nickmass.skipped', {count: amounts.skipped.toLocaleString(language)}));
            }
            if (amounts.failed) {
              description.push(translate('nickmass.failed_permissions', {count: amounts.failed.toLocaleString(language)}));
            }
            if (errors.length) {
              description.push(translate('nickmass.failed_unknown', {count: errors.length.toLocaleString(language)}));
            }
          }
          return description;
        };
        // stopped by the button, or by an error nobody can get past
        const setStopped = () => {
          payload.color = EmbedColors.ERROR;
          payload.title = translate('nickmass.cancelled_title');
          payload.description = describe('nickmass.cancelled').join('\n');
        };

        {
          payload.description = translate('nickmass.starting', {count: members.length.toLocaleString(language), seconds: ((members.length / amount) * time).toLocaleString(language)});
          payload.color = EmbedColors.LOG_UPDATE;

          // has to outlive the run, Stop is the only way to end it (the 15 minute default left runs over ~900 members
          // unstoppable)
          const components = new Components({timeout: progressTimeout(members.length)});
          components.createButton({
            label: translate('common.refresh'),
            style: MessageComponentButtonStyles.SECONDARY,
            run: async (ctx: ComponentContext) => {
              // `payload` holds the result once it ended, this puts it on a progress message the end couldn't edit
              // (a slash command's after 15 minutes) instead of putting the buttons back
              if (!isRunning()) {
                return ctx.editOrRespond(await renderDisplay(context, payload));
              }
              const finished = countFinished();
              const description = describe('nickmass.finished');
              if (members.length !== finished) {
                description.push('');
                description.push(translate('nickmass.time_left', {seconds: (((members.length - finished) / amount) * time).toLocaleString(language)}));
              }
              const options = await renderDisplay(context, {...payload, description: description.join('\n'), components});
              if (!isRunning()) {
                return ctx.editOrRespond(await renderDisplay(context, payload));
              }
              return ctx.editOrRespond(options);
            },
          });
          components.createButton({
            label: translate('common.stop'),
            style: MessageComponentButtonStyles.SECONDARY,
            run: async (ctx: ComponentContext) => {
              // stop it and give the number of people edited
              if (ctx.userId !== context.userId) {
                return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
              }
              if (!end()) {
                return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
              }
              setStopped();
              return displayReply(context, payload, {replyTo: ctx});
            },
          });
          try {
            await displayReply(context, {...payload, components}, {replyTo: ctx});
          } catch(error) {
            end();
            throw error;
          }
        }

        for (let member of members) {
          // the run's own state, not `isExecuting.nick` (see `NickMassRun`)
          if (!isRunning()) {
            break;
          }

          let nickname: string;
          try {
            nickname = await createNickname(member);
          } catch(error) {
            // a script can still error for some members (like `{exit}` or a timeout), that shouldn't stop the rest
            errors.push(error);
            continue;
          }

          // an empty script result would clear their nickname, that's what `nick-mass reset` is for
          if (member.name === nickname || (isScript && !nickname)) {
            amounts.skipped++;
            continue;
          }

          if (member.isMe) {
            if (!me.canChangeNickname) {
              amounts.failed++;
              continue;
            }
          } else if (!me.canEdit(member) || !me.canChangeNicknames) {
            amounts.failed++;
            continue;
          }

          // Stop could've been pressed while the script rendered
          if (!isRunning()) {
            break;
          }
          try {
            await member.editNick(nickname, {reason});
            amounts.changed++;
          } catch(error) {
            errors.push(error);
            if (!error.response || !ERROR_CODES_IGNORE.includes(error.response.statusCode)) {
              // anything else stops the run, ended like a Stop so the progress message doesn't stay "in progress" (a
              // button's error goes nowhere) and the server isn't left "in progress" until a restart
              error.metadata = {
                canEdit: me.canEdit(member),
                canChangeNicknames: me.canChangeNicknames,
                user: member.user,
              };
              captureCommandError(context, error, 'nick_mass');
              end();
              break;
            }
          }
        }

        // only a run that went through every member gets here still running, a stopped one already let go of the lock
        if (end()) {
          payload.color = EmbedColors.LOG_CREATION;
          payload.description = describe('nickmass.finished').join('\n');
        } else {
          // counted again, the edit that was going when Stop was pressed has landed by now
          setStopped();
        }
        return finishWithDisplay(context, ctx, message, payload);
      },
    });

    components.createButton({
      label: translate('common.cancel'),
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        return confirmer.cancel(ctx, () => {
          payload.color = EmbedColors.ERROR;
          payload.title = translate('nickmass.cancelled_title');
          payload.description = translate('nickmass.cancelled_before', {count: members.length.toLocaleString(language)});
          return displayReply(context, payload, {replyTo: ctx});
        });
      },
    });

    const message = await replyWithMessage(context, await renderDisplay(context, {...payload, components}));
    components.onTimeout = () => confirmer.expire(async () => {
      try {
        payload.color = EmbedColors.ERROR;
        payload.title = translate('nickmass.expired_title');
        payload.footer = translate('nickmass.expired');
        await expireWithDisplay(context, message, payload);
      } catch(error) {

      }
    });
    return message || undefined;
  }
  return displayReply(context, {description: translate('nickmass.none')});
}


export async function replyWithMessage(
  context: Command.Context | Interaction.InteractionContext,
  options: Record<string, any>,
): Promise<Structures.Message | null> {
  if (context instanceof Command.Context) {
    return context.reply(options);
  }
  await context.editOrRespond(options as Structures.InteractionEditOrRespond);
  return null;
}

export async function finishWithDisplay(
  context: Command.Context | Interaction.InteractionContext,
  ctx: ComponentContext,
  message: Structures.Message | null,
  payload: DisplayPayload,
) {
  const options = await renderDisplay(context, payload);
  if (message && message.deleted) {
    return message.reply(options);
  }
  if (!ctx.interaction.deleted) {
    try {
      return await ctx.editOrRespond(options);
    } catch(error) {
      // interaction tokens expire after 15 minutes, long runs fall through to the fallbacks below
    }
  }
  if (message) {
    return message.edit(options);
  }
  // slash commands have no message of their own to edit, so post the results as a normal message instead
  try {
    return await context.rest.createMessage(context.channelId!, await renderDisplayWithMention(context, payload));
  } catch(error) {
    // we can't send messages in the channel, so dm the results to whoever started it
    const channel = await context.rest.createDm({recipientId: context.userId});
    return channel.createMessage(options);
  }
}


// pings whoever started it, embeds can't ping and components v2 can't have content, so the mention goes where it'll work
async function renderDisplayWithMention(
  context: Command.Context | Interaction.InteractionContext,
  payload: DisplayPayload,
): Promise<Record<string, any>> {
  const mention = `<@${context.userId}>`;
  const allowedMentions = {users: [context.userId]};
  const options = await renderDisplay(context, {...payload, allowedMentions});
  if (options.embed) {
    options.content = mention;
    return options;
  }
  return renderDisplay(context, {
    ...payload,
    allowedMentions,
    description: [mention, payload.description].filter(Boolean).join('\n'),
  });
}


export async function expireWithDisplay(
  context: Command.Context | Interaction.InteractionContext,
  message: Structures.Message | null,
  payload: DisplayPayload,
) {
  const options = await renderDisplay(context, payload);
  if (message) {
    if (message.canEdit) {
      await message.edit(options);
    }
  } else if (context instanceof Interaction.InteractionContext) {
    await context.editOrRespond(options);
  }
}
