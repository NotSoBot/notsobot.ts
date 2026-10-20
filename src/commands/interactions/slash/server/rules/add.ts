import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { MAX_GUILD_RULE_MESSAGE_LENGTH, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, ParsedGuildRuleCoverage, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { coverageOption, getMissingTargets, targetOptions } from './shared';


export const COMMAND_NAME = 'add';

export interface CommandArgs {
  action: 'allow' | 'block',
  admins?: boolean,
  channels?: Array<Structures.Channel> | null,
  message?: string,
  roles?: Array<Structures.Role> | null,
  target: ParsedGuildRuleCoverage | false,
  users?: Array<Structures.Member | Structures.User> | null,
}

export class ServerRulesAddCommand extends BaseInteractionCommandOption {
  description = 'Block or allow everything, a category, or a command for Channels/Roles/Users or Server-Wide';
  descriptionLocalizations = I18n.localizations('commands.rules.add.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.add.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'action',
          description: 'Block or Allow',
          ...I18n.optionLocalizations('commands.rules.add.action'),
          choices: Parameters.Slash.oneOf({choices: {BLOCK: 'block', ALLOW: 'allow'}, doNotSort: true, localizationKey: 'choices.guild_rule_actions'}),
          required: true,
        },
        coverageOption('commands.rules.add.target'),
        ...targetOptions('commands.rules.add'),
        {
          name: 'message',
          description: 'Shown to whoever this block stops',
          ...I18n.optionLocalizations('commands.rules.add.message'),
          maxLength: MAX_GUILD_RULE_MESSAGE_LENGTH,
        },
        {
          name: 'admins',
          description: 'If it applies to the server owner and admins too (Default: the server setting)',
          ...I18n.optionLocalizations('commands.rules.add.admins'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.target) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.unknown_target')}`, ephemeral: true});
    }
    const missing = getMissingTargets(translate, args);
    if (missing) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${missing}`, ephemeral: true});
    }
    return Formatter.Commands.ModerationRulesAdd.createMessage(context, {
      admins: (typeof(args.admins) === 'boolean') ? args.admins : null,
      allow: args.action === 'allow',
      // the autocomplete always says which, only typed out names can be both
      ambiguousCategory: args.target.ambiguousCategory,
      channels: args.channels || null,
      coverage: args.target.coverage,
      message: args.message || null,
      roles: args.roles || null,
      users: args.users || null,
    });
  }
}
