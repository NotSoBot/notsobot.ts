import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../api/types';
import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagInfoCommand extends BaseInteractionCommandOption {
  description = 'View a Tag\'s Information';
  descriptionLocalizations = I18n.localizations('commands.tag.info.description');
  metadata = {
    id: Formatter.Commands.TagInfo.COMMAND_ID,
  };
  name = 'info';

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.info.name'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagInfo.CommandArgs) {
    return Formatter.Commands.TagInfo.createMessage(context, args);
  }
}
