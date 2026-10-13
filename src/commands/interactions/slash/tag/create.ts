import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionTagWriteCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  content: string,
  tag: string,
}

export class TagCreateCommand extends BaseInteractionTagWriteCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Create a tag';
  descriptionLocalizations = I18n.localizations('commands.tag.create.description');
  metadata = {
    id: Formatter.Commands.TagCreate.COMMAND_ID,
  };
  name = 'create';
  nameLocalizations = I18n.localizations('commands.tag.create.name');

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.create.name'),
          label: 'tag',
          required: true,
          value: Parameters.tagName,
        },
        {
          name: 'content',
          description: 'Tag\'s Content',
          ...I18n.optionLocalizations('commands.tag.create.content'),
          required: true,
          value: Parameters.tagContent,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.tag && !!args.content;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag || args.content) {
      if (!args.tag) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.needs_name')}`});
      }
      if (!args.content) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.needs_content')}`});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagCreate.CommandArgs) {
    return Formatter.Commands.TagCreate.createMessage(context, args);
  }
}
