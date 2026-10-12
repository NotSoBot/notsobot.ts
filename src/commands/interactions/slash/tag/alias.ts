import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'alias';

export class TagAliasCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Create a Tag Alias';
  descriptionLocalizations = I18n.localizations('commands.tag.alias.description');
  metadata = {
    id: Formatter.Commands.TagAlias.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to alias from',
          ...I18n.optionLocalizations('commands.tag.alias.tag'),
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.alias.name'),
          required: true,
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    return !!args.tag && !!args.name;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null || args.name) {
      if (!args.name) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.alias_needs_name')}`);
      }
      if (args.tag === false) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgs) {
    return Formatter.Commands.TagAlias.createMessage(context, args);
  }
}
