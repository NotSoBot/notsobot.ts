import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner guild features remove';

export default class OwnerGuildFeaturesRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.OWNER,
        description: 'Remove a feature from the current guild',
        examples: [
          `${COMMAND_NAME} FREE_CUSTOM_COMMANDS`,
        ],
        id: Formatter.Commands.OwnerGuildFeaturesRemove.COMMAND_ID,
        usage: '<feature> ?<guild:id>',
      },
      type: [
        {
          name: 'feature',
          choices: Object.values(GuildFeatures),
          help: `Must be one of (${Object.values(GuildFeatures).join(', ')})`,
          type: (value: string) => value.toUpperCase(),
        },
        {name: 'guild', default: DefaultParameters.guild, type: Parameters.guild},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.guild) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerGuildFeaturesRemove.CommandArgs) {
    return Formatter.Commands.OwnerGuildFeaturesRemove.createMessage(context, args);
  }
}
