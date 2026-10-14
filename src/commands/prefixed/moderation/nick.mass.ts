import { Command, CommandClient, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, MessageFlags, Permissions } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { CommandCategories, DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../../stores/serverexecutions';
import { DisplayPayload, I18n, Parameters, createTimestampMomentFromGuild, displayReply, renderDisplay } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const NameRegexes = {
  DISCRIMINATOR: /{(?:discrim|discriminator)}/g,
  GUILD: /{guild}/g,
  NICKNAME: /{(?:name|nick)}/g,
  USERNAME: /{(?:user|username)}/g,
};
export const NAME_REGEXES = Object.values(NameRegexes);


export const ERROR_CODES_IGNORE = [400, 403];
export const MAX_MEMBERS = 5000;
export const MAX_NICKNAME_LENGTH = 32;
export const MAX_TIME_TO_RESPOND = 60 * 1000;
export const RATELIMIT_TIME = [10, 10]; // 10 members per 10 seconds (use a constant incase it changes in the future)

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

export const COMMAND_NAME = 'nick mass';

export default class NickMassCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'nobots', type: Boolean},
        {name: 'nousers', type: Boolean},
        {name: 'role', type: Parameters.role},
      ],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Change the nickname of multiple members',
        examples: [
          `${COMMAND_NAME} troy`,
          `${COMMAND_NAME} troy -role admin`,
          `${COMMAND_NAME} troy -nobots`,
          `${COMMAND_NAME} troy -nousers`,
        ],
        category: CommandCategories.MODERATION,
        usage: '<text> (-nobots) (-nousers) (-role <role:id|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner || ((context.guild) ? context.guild.memberCount <= MAX_MEMBERS : false);
  }

  async onCancel(context: Command.Context): Promise<any> {
    const { language, translate } = await I18n.getTranslator(context);
    if (context.guild && MAX_MEMBERS < context.guild.memberCount) {
      return displayReply(context, {description: translate('nickmass.too_many_members', {max: MAX_MEMBERS.toLocaleString(language)})});
    }
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    if (args.nobots && args.nousers) {
      return false;
    }
    return !!args.text;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.role === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('logger.unknown_role')}`});
    }
    if (args.nobots && args.nousers) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('nickmass.who_then_bots')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    return createNickMassMessage(context, args);
  }
}


export async function createNickMassMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await I18n.getTranslator(context);
  const guild = context.guild!;
  const me = guild.me!;

  const nick = args.text;

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
    return member.name !== nick && me.canEdit(member) && canInvokerEdit(member);
  });

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

    const components = new Components({timeout: 5 * (60 * 1000)});
    components.createButton({
      label: translate('common.continue'),
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        // checked again here, two prompts could both be continued and rename everyone twice at the same time
        if (isExecuting.nick) {
          return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
            content: translate('nickmass.in_progress'),
            flags: MessageFlags.EPHEMERAL,
          });
        }
        isExecuting.nick = true;

        const amounts = {
          changed: 0,
          failed: 0,
          skipped: 0,
        };
        const errors: Array<any> = [];
        const reason = translate('nickmass.audit_reason', {user: `${context.user} (${context.user.id})`});

        {
          payload.description = translate('nickmass.starting', {count: members.length.toLocaleString(language), seconds: ((members.length / amount) * time).toLocaleString(language)});
          payload.color = EmbedColors.LOG_UPDATE;

          const components = new Components();
          components.createButton({
            label: translate('common.refresh'),
            style: MessageComponentButtonStyles.SECONDARY,
            run: async (ctx: ComponentContext) => {
              const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

              const description: Array<string> = [];
              description.push(translate('nickmass.finished', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
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
              if (members.length !== finished) {
                description.push('');
                description.push(translate('nickmass.time_left', {seconds: (((members.length - finished) / amount) * time).toLocaleString(language)}));
              }
              payload.description = description.join('\n');

              ctx.editOrRespond(await renderDisplay(context, {...payload, components}));
            },
          });
          components.createButton({
            label: translate('common.stop'),
            style: MessageComponentButtonStyles.DANGER,
            run: async (ctx: ComponentContext) => {
              // stop it and give the number of people edited
              if (ctx.userId !== context.userId) {
                return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
              }
              isExecuting.nick = false;

              payload.color = EmbedColors.ERROR;
              payload.title = translate('nickmass.cancelled_title');
              {
                const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

                const description: Array<string> = [];
                description.push(translate('nickmass.cancelled', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
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
                payload.description = description.join('\n');
              }
              return displayReply(context, payload, {replyTo: ctx});
            },
          });
          try {
            await displayReply(context, {...payload, components}, {replyTo: ctx});
          } catch(error) {
            isExecuting.nick = false;
            throw error;
          }
        }

        isExecuting.nick = true;
        for (let member of members) {
          if (!isExecuting.nick) {
            break;
          }

          let nickname = nick;
          for (let regex of NAME_REGEXES) {
            switch (regex) {
              case NameRegexes.DISCRIMINATOR: {
                nickname = nickname.replace(regex, member.discriminator);
              }; break;
              case NameRegexes.GUILD: {
                nickname = nickname.replace(regex, guild.name);
              }; break;
              case NameRegexes.NICKNAME: {
                nickname = nickname.replace(regex, member.name);
              }; break;
              case NameRegexes.USERNAME: {
                nickname = nickname.replace(regex, member.username);
              }; break;
            }
          }
          nickname = nickname.slice(0, MAX_NICKNAME_LENGTH).trim();

          if (member.name === nickname) {
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
            await member.editNick(nickname, {reason});
            amounts.changed++;
          } catch(error) {
            if (error.response && ERROR_CODES_IGNORE.includes(error.response.statusCode)) {
              errors.push(error);
            } else {
              error.metadata = {
                canEdit: me.canEdit(member),
                canChangeNicknames: me.canChangeNicknames,
                user: member.user,
              };
              // otherwise the server stays "in progress" until a restart
              isExecuting.nick = false;
              throw error;
            }
          }
        }

        if (!isExecuting.nick) {
          payload.color = EmbedColors.ERROR;
          payload.title = translate('nickmass.cancelled_title');
          {
            const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

            const description: Array<string> = [];
            description.push(translate('nickmass.cancelled', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
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
            payload.description = description.join('\n');
          }

          return finishWithDisplay(context, ctx, message, payload);
        }
        isExecuting.nick = false;

        {
          const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

          const description: Array<string> = [];
          description.push(translate('nickmass.finished', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
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
          payload.color = EmbedColors.LOG_CREATION;
          payload.description = description.join('\n');
        }

        return finishWithDisplay(context, ctx, message, payload);
      },
    });

    components.createButton({
      label: translate('common.cancel'),
      style: MessageComponentButtonStyles.DANGER,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        payload.color = EmbedColors.ERROR;
        payload.title = translate('nickmass.cancelled_title');
        payload.description = translate('nickmass.cancelled_before', {count: members.length.toLocaleString(language)});
        await displayReply(context, payload, {replyTo: ctx});
      },
    });

    const message = await replyWithMessage(context, await renderDisplay(context, {...payload, components}));
    components.onTimeout = async () => {
      try {
        payload.color = EmbedColors.ERROR;
        payload.title = translate('nickmass.expired_title');
        payload.footer = translate('nickmass.expired');
        await expireWithDisplay(context, message, payload);
      } catch(error) {

      }
    };
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
