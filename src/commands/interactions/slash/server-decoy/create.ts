import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  from?: Structures.Member | Structures.User,
  in?: Structures.Channel,
  name?: string,
  notice?: 'bot' | 'me',
}

export class ServerDecoyCreateCommand extends BaseInteractionCommandOption {
  // NotSoBot's owners don't skip the member permissions here, it removes people
  permissionsIgnoreClientOwner = false;

  description = 'Make a channel that removes anyone who posts in it';
  descriptionLocalizations = I18n.localizations('commands.decoy.create.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID_CREATE,
  };
  name = 'create';
  nameLocalizations = I18n.localizations('commands.decoy.create.name');
  permissions = [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS];

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'The channel\'s name (Default: one that fits the server\'s other channels)',
          ...I18n.optionLocalizations('commands.decoy.create.name_option'),
          maxLength: 100,
        },
        {
          name: 'in',
          description: 'Category to make it in (Default: the top of the channel list)',
          ...I18n.optionLocalizations('commands.decoy.create.in'),
          channelTypes: [ChannelTypes.GUILD_CATEGORY],
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
        {
          name: 'notice',
          description: 'Who posts its one message, your own words are harder for spam tools to spot (Default: NotSoBot)',
          ...I18n.optionLocalizations('commands.decoy.create.notice'),
          choices: [
            Parameters.Slash.createChoice('NotSoBot posts it (easier for spam tools to spot)', 'bot', {localizationKey: 'decoy.choice_notice_bot'}),
            Parameters.Slash.createChoice('I post it myself, in my own words (harder to spot)', 'me', {localizationKey: 'decoy.choice_notice_me'}),
          ],
        },
        {
          name: 'from',
          description: 'Someone else posts the notice instead of you',
          ...I18n.optionLocalizations('commands.decoy.create.from'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createCreateMessage(context, {
      from: args.from,
      in: args.in,
      name: args.name,
      // picking who posts it means they post it
      notice: (args.from) ? 'me' : args.notice,
    });
  }
}
