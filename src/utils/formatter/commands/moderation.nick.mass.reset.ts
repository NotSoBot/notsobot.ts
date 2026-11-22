import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { captureCommandError } from '../../../sentry';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { Confirmer } from '../../confirmer';
import { DisplayPayload, I18n, displayReply, formatUserForAuditLog, renderDisplay, renderEphemeralDisplay } from '../../../utils';

import {
  ERROR_CODES_IGNORE,
  RATELIMIT_TIME,
  expireWithDisplay,
  finishWithDisplay,
  progressTimeout,
  replyWithMessage,
  startNickMassRun,
} from './moderation.nick.mass';


export const COMMAND_ID = 'moderation.nick.mass.reset';

export interface CommandArgsBefore {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}

export interface CommandArgs {
  nobots: boolean,
  nousers: boolean,
  role?: null | Structures.Role,
  text: string,
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await I18n.getTranslator(context);
  const guild = context.guild as Structures.Guild;
  const me = guild.me as Structures.Member;

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
    return me.canEdit(member) && canInvokerEdit(member);
  });
  const membersThatWillBeSkipped = members.filter((x) => !x.nick).length;

  const [ amount, time ] = RATELIMIT_TIME;

  const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
  if (isExecuting.nick) {
    return displayReply(context, {description: translate('nickmass.in_progress')});
  }

  if (members.length) {
    const membersThatWillBeEdited = members.length - membersThatWillBeSkipped;

    const payload: DisplayPayload = {fields: []};
    payload.color = EmbedColors.DEFAULT;
    payload.title = translate('nickmass.reset_can_clear', {count: membersThatWillBeEdited.toLocaleString(language), total: guild.members.length.toLocaleString(language)});
    payload.description = [
      translate('nickmass.reset_estimate', {seconds: ((membersThatWillBeEdited / amount) * time).toLocaleString(language)}),
      translate('nickmass.reset_no_nickname', {count: membersThatWillBeSkipped.toLocaleString(language)}),
    ].join('\n');

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
        const reason = I18n.getCachedGuildTranslator(context).translate('nickmass.reset_audit_reason', {user: formatUserForAuditLog(context.user)});

        // read fresh each time, a Stop (or `nick-mass cancel`) ends it while the loop below awaits
        const { end, isRunning } = run;
        const countFinished = () => amounts.changed + amounts.skipped + amounts.failed + errors.length;
        const describe = (
          headerKey: 'nickmass.reset_cancelled' | 'nickmass.reset_finished',
          changedKey: 'nickmass.reset_cleared' | 'nickmass.reset_reset',
        ): Array<string> => {
          const finished = countFinished();
          const description: Array<string> = [];
          description.push(translate(headerKey, {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
          if (finished) {
            if (amounts.changed) {
              description.push(translate(changedKey, {count: amounts.changed.toLocaleString(language)}));
            }
            if (amounts.skipped) {
              description.push(translate('nickmass.reset_skipped', {count: amounts.skipped.toLocaleString(language)}));
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
        const setStopped = (changedKey: 'nickmass.reset_cleared' | 'nickmass.reset_reset') => {
          payload.color = EmbedColors.ERROR;
          payload.title = translate('nickmass.reset_cancelled_title');
          payload.description = describe('nickmass.reset_cancelled', changedKey).join('\n');
        };

        {
          payload.description = translate('nickmass.reset_starting', {count: membersThatWillBeEdited.toLocaleString(language), seconds: ((membersThatWillBeEdited / amount) * time).toLocaleString(language)});
          payload.color = EmbedColors.LOG_UPDATE;

          // has to outlive the run, Stop is the only way to end it (20 minutes left bigger runs unstoppable)
          const components = new Components({timeout: progressTimeout(membersThatWillBeEdited)});
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
              const description = describe('nickmass.reset_finished', 'nickmass.reset_cleared');
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
              setStopped('nickmass.reset_cleared');
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

          if (!member.nick) {
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

          try {
            await member.editNick('', {reason});
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
              captureCommandError(context, error, 'nick_mass_reset');
              end();
              break;
            }
          }
        }

        // only a run that went through every member gets here still running, a stopped one already let go of the lock
        if (end()) {
          payload.color = EmbedColors.LOG_CREATION;
          payload.description = describe('nickmass.reset_finished', 'nickmass.reset_reset').join('\n');
        } else {
          // counted again, the edit that was going when Stop was pressed has landed by now
          setStopped('nickmass.reset_reset');
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
          payload.title = translate('nickmass.reset_cancelled_title');
          payload.description = translate('nickmass.reset_cancelled_before', {count: members.length.toLocaleString(language)});
          return displayReply(context, payload, {replyTo: ctx});
        });
      },
    });

    const message = await replyWithMessage(context, await renderDisplay(context, {...payload, components}));
    components.onTimeout = () => confirmer.expire(async () => {
      try {
        payload.color = EmbedColors.ERROR;
        payload.footer = translate('nickmass.expired');
        await expireWithDisplay(context, message, payload);
      } catch(error) {

      }
    });
    return message || undefined;
  }
  return displayReply(context, {description: translate('nickmass.reset_none')});
}
