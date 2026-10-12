import { Command, CommandClient, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { CommandCategories, DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../../stores/serverexecutions';
import { I18n, Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { ERROR_CODES_IGNORE, MAX_MEMBERS, MAX_TIME_TO_RESPOND, RATELIMIT_TIME } from './nick.mass';


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

export const COMMAND_NAME = 'nick mass reset';

export default class NickMassResetCommand extends BaseCommand {
  triggerTypingAfter = -1;

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
        description: 'Reset the nickname of multiple members',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -role admin`,
          `${COMMAND_NAME} -nobots`,
          `${COMMAND_NAME} -nousers`,
        ],
        category: CommandCategories.MODERATION,
        usage: '(-nobots) (-nousers) (-role <role:id|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner || ((context.guild) ? context.guild.memberCount <= MAX_MEMBERS : false);
  }

  async onCancel(context: Command.Context): Promise<any> {
    const { language, translate } = await I18n.getTranslator(context);
    if (context.guild && MAX_MEMBERS < context.guild.memberCount) {
      return editOrReply(context, translate('nickmass.too_many_members', {max: MAX_MEMBERS.toLocaleString(language)}));
    }
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    if (args.nobots && args.nousers) {
      return false;
    }
    return true;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.role === null) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('logger.unknown_role')}`);
    }
    if (args.nobots && args.nousers) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('nickmass.who_then')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { language, translate } = await I18n.getTranslator(context);
    const guild = context.guild as Structures.Guild;
    const me = guild.me as Structures.Member;

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
      return me.canEdit(member);
    });
    const membersThatWillBeSkipped = members.filter((x) => !x.nick).length;

    const [ amount, time ] = RATELIMIT_TIME;

    const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
    if (isExecuting.nick) {
      return context.reply(translate('nickmass.in_progress'));
    }

    if (members.length) {
      const membersThatWillBeEdited = members.length - membersThatWillBeSkipped;

      const embed = createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setTitle(translate('nickmass.reset_can_clear', {count: membersThatWillBeEdited.toLocaleString(language), total: guild.members.length.toLocaleString(language)}));
      embed.setDescription([
        translate('nickmass.reset_estimate', {seconds: ((membersThatWillBeEdited / amount) * time).toLocaleString(language)}),
        translate('nickmass.reset_no_nickname', {count: membersThatWillBeSkipped.toLocaleString(language)}),
      ].join('\n'));

      const components = new Components({timeout: 5 * (60 * 1000)});
      components.createButton({
        label: translate('common.continue'),
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          const amounts = {
            changed: 0,
            failed: 0,
            skipped: 0,
          };
          const errors: Array<any> = [];
          const reason = translate('nickmass.reset_audit_reason', {user: `${context.user} (${context.user.id})`});

          {
            embed.setDescription(translate('nickmass.reset_starting', {count: membersThatWillBeEdited.toLocaleString(language), seconds: ((membersThatWillBeEdited / amount) * time).toLocaleString(language)}));
            embed.setColor(EmbedColors.LOG_UPDATE);

            const components = new Components({timeout: 20 * (60 * 1000)});
            components.createButton({
              label: translate('common.refresh'),
              style: MessageComponentButtonStyles.SECONDARY,
              run: async (ctx: ComponentContext) => {
                const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

                const description: Array<string> = [];
                description.push(translate('nickmass.reset_finished', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
                if (finished) {
                  if (amounts.changed) {
                    description.push(translate('nickmass.reset_cleared', {count: amounts.changed.toLocaleString(language)}));
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
                if (members.length !== finished) {
                  description.push('');
                  description.push(translate('nickmass.time_left', {seconds: (((members.length - finished) / amount) * time).toLocaleString(language)}));
                }
                embed.setDescription(description.join('\n'));

                ctx.editOrRespond({embed});
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

                embed.setColor(EmbedColors.ERROR);
                embed.setTitle(translate('nickmass.reset_cancelled_title'));
                {
                  const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

                  const description: Array<string> = [];
                  description.push(translate('nickmass.reset_cancelled', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
                  if (finished) {
                    if (amounts.changed) {
                      description.push(translate('nickmass.reset_cleared', {count: amounts.changed.toLocaleString(language)}));
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
                  embed.setDescription(description.join('\n'));
                }
                return ctx.editOrRespond({components: [], embed});
              },
            });
            await ctx.editOrRespond({components, embed});
          }

          isExecuting.nick = true;
          for (let member of members) {
            if (!isExecuting.nick) {
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
              if (error.response && ERROR_CODES_IGNORE.includes(error.response.statusCode)) {
                errors.push(error);
              } else {
                error.metadata = {
                  canEdit: me.canEdit(member),
                  canChangeNicknames: me.canChangeNicknames,
                  user: member.user,
                };
                throw error;
              }
            }
          }

          if (!isExecuting.nick) {
            embed.setColor(EmbedColors.ERROR);
            embed.setTitle(translate('nickmass.reset_cancelled_title'));
            {
              const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

              const description: Array<string> = [];
              description.push(translate('nickmass.reset_cancelled', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
              if (finished) {
                if (amounts.changed) {
                  description.push(translate('nickmass.reset_reset', {count: amounts.changed.toLocaleString(language)}));
                }
                if (amounts.skipped) {
                  description.push(`- Skipped ${amounts.skipped.toLocaleString()} members`);
                }
                if (amounts.failed) {
                  description.push(translate('nickmass.failed_permissions', {count: amounts.failed.toLocaleString(language)}));
                }
                if (errors.length) {
                  description.push(translate('nickmass.failed_unknown', {count: errors.length.toLocaleString(language)}));
                }
              }
              embed.setDescription(description.join('\n'));
            }

            if (message.deleted) {
              return message.reply({embed});
            }
            return (ctx.interaction.deleted) ? message.edit({components: [], embed}) : ctx.editOrRespond({components: [], embed});
          }
          isExecuting.nick = false;

          {
            const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

            const description: Array<string> = [];
            description.push(translate('nickmass.reset_finished', {count: finished.toLocaleString(language), total: members.length.toLocaleString(language)}));
            if (finished) {
              if (amounts.changed) {
                description.push(translate('nickmass.reset_reset', {count: amounts.changed.toLocaleString(language)}));
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
            embed.setColor(EmbedColors.LOG_CREATION);
            embed.setDescription(description.join('\n'));
          }

          if (message.deleted) {
            return message.reply({embed});
          }
          return (ctx.interaction.deleted) ? message.edit({components: [], embed}) : ctx.editOrRespond({components: [], embed});
        },
      });

      components.createButton({
        label: translate('common.cancel'),
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          embed.setColor(EmbedColors.ERROR);
          embed.setTitle(translate('nickmass.reset_cancelled_title'));
          embed.setDescription(translate('nickmass.reset_cancelled_before', {count: members.length.toLocaleString(language)}));
          await ctx.editOrRespond({components: [], embed});
        },
      });

      const message = await context.reply({components, embed});
      components.onTimeout = async () => {
        try {
          embed.setColor(EmbedColors.ERROR);
          embed.setFooter(translate('nickmass.expired'));
          if (message.canEdit) {
            await message.edit({components: [], embed});
          }
        } catch(error) {

        }
      };
      return message;
    }
    return editOrReply(context, translate('nickmass.reset_none'));
  }
}
