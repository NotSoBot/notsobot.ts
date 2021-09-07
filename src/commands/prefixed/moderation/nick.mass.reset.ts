import { Command, CommandClient, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../../stores/serverexecutions';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';

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
        type: CommandTypes.MODERATION,
        usage: '(-nobots) (-nousers) (-role <role:id|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
    });
  }

  onBefore(context: Command.Context) {
    return (context.guild) ? context.guild.memberCount <= MAX_MEMBERS : false;
  }

  onCancel(context: Command.Context) {
    if (context.guild && MAX_MEMBERS < context.guild.memberCount) {
      return editOrReply(context, `Cannot mass nick edit on servers with more than ${MAX_MEMBERS.toLocaleString()} members`);
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

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.role === null) {
      return editOrReply(context, '⚠ Unknown Role');
    }
    if (args.nobots && args.nousers) {
      return editOrReply(context, '⚠ who then?!');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
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
      return !!member.nick && me.canEdit(member);
    });

    const [ amount, time ] = RATELIMIT_TIME;

    const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
    if (isExecuting.nick) {
      return context.reply('Already mass editing nicks');
    }

    if (members.length) {
      const embed = createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setTitle(`Can clear the nickname of ${members.length.toLocaleString()} out of ${guild.members.length.toLocaleString()} members`);
      embed.setDescription(`Should take about ${((members.length / amount) * time).toLocaleString()} seconds`);

      const components = new Components({timeout: 5 * (60 * 1000)});
      components.createButton({
        label: 'Continue',
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
          const reason = `Mass Nickname Reset by ${context.user} (${context.user.id})`;

          {
            embed.setDescription(`Ok, starting to clear ${members.length.toLocaleString()} member\'s nicknames. (Should take about ${((members.length / amount) * time).toLocaleString()} seconds)`);
            embed.setColor(EmbedColors.LOG_UPDATE);

            const components = new Components({timeout: 20 * (60 * 1000)});
            components.createButton({
              label: 'Refresh',
              style: MessageComponentButtonStyles.SECONDARY,
              run: async (ctx: ComponentContext) => {
                const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

                const description: Array<string> = [];
                description.push(`Finished the clearing nicknames of ${finished.toLocaleString()} out of ${members.length.toLocaleString()} members`);
                if (finished) {
                  if (amounts.changed) {
                    description.push(`- Cleared ${amounts.changed.toLocaleString()} members successfully`);
                  }
                  if (amounts.skipped) {
                    description.push(`- Skipped ${amounts.skipped.toLocaleString()} members`);
                  }
                  if (amounts.failed) {
                    description.push(`- Failed to edit ${amounts.failed.toLocaleString()} members due to permissions`);
                  }
                  if (errors.length) {
                    description.push(`- Failed to edit ${errors.length.toLocaleString()} members due to some unknown error`);
                  }
                }
                if (members.length !== finished) {
                  description.push('');
                  description.push(`About ${(((members.length - finished) / amount) * time).toLocaleString()} seconds left.`);
                }
                embed.setDescription(description.join('\n'));

                ctx.editOrRespond({embed});
              },
            });
            components.createButton({
              label: 'Stop',
              style: MessageComponentButtonStyles.DANGER,
              run: async (ctx: ComponentContext) => {
                // stop it and give the number of people edited
                if (ctx.userId !== context.userId) {
                  return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
                }
                isExecuting.nick = false;

                embed.setColor(EmbedColors.ERROR);
                embed.setTitle('Mass Nickname Reset Canceled');
                {
                  const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

                  const description: Array<string> = [];
                  description.push(`Canceled the clearing nicknames of ${members.length.toLocaleString()} members (Edited ${finished.toLocaleString()} members)`);
                  if (finished) {
                    if (amounts.changed) {
                      description.push(`- Cleared ${amounts.changed.toLocaleString()} members successfully`);
                    }
                    if (amounts.skipped) {
                      description.push(`- Skipped ${amounts.skipped.toLocaleString()} members`);
                    }
                    if (amounts.failed) {
                      description.push(`- Failed to edit ${amounts.failed.toLocaleString()} members due to permissions`);
                    }
                    if (errors.length) {
                      description.push(`- Failed to edit ${errors.length.toLocaleString()} members due to some unknown error`);
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
            embed.setTitle('Mass Nickname Reset Canceled');
            {
              const finished = amounts.changed + amounts.skipped + amounts.failed + errors.length;

              const description: Array<string> = [];
              description.push(`Canceled the clearing nicknames of ${members.length.toLocaleString()} members (Edited ${finished.toLocaleString()} members)`);
              if (finished) {
                if (amounts.changed) {
                  description.push(`- Reset ${amounts.changed.toLocaleString()} members successfully`);
                }
                if (amounts.skipped) {
                  description.push(`- Skipped ${amounts.skipped.toLocaleString()} members`);
                }
                if (amounts.failed) {
                  description.push(`- Failed to edit ${amounts.failed.toLocaleString()} members due to permissions`);
                }
                if (errors.length) {
                  description.push(`- Failed to edit ${errors.length.toLocaleString()} members due to some unknown error`);
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
            description.push(`Finished the clearing nicknames of ${finished.toLocaleString()} out of ${members.length.toLocaleString()} members`);
            if (finished) {
              if (amounts.changed) {
                description.push(`- Reset ${amounts.changed.toLocaleString()} members successfully`);
              }
              if (amounts.skipped) {
                description.push(`- Skipped ${amounts.skipped.toLocaleString()} members`);
              }
              if (amounts.failed) {
                description.push(`- Failed to edit ${amounts.failed.toLocaleString()} members due to permissions`);
              }
              if (errors.length) {
                description.push(`- Failed to edit ${errors.length.toLocaleString()} members due to some unknown error`);
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
        label: 'Cancel',
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          embed.setColor(EmbedColors.ERROR);
          embed.setTitle('Mass Nickname Reset Canceled');
          embed.setDescription(`Canceled the clearing of ${members.length.toLocaleString()} member\'s nicknames`);
          await ctx.editOrRespond({components: [], embed});
        },
      });

      const message = await context.reply({components, embed});
      components.onTimeout = async () => {
        try {
          embed.setColor(EmbedColors.ERROR);
          embed.setFooter('Request expired, press a button next time');
          if (message.canEdit) {
            await message.edit({components: [], embed});
          }
        } catch(error) {

        }
      };
      return message;
    }
    return editOrReply(context, 'Unable to clear anyone\'s nick');
  }
}
