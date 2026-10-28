import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsScreenshotCommand extends BaseInteractionCommandOption {
  description = 'Take a screenshot of a website';
  descriptionLocalizations = I18n.localizations('commands.tools.screenshot.description');
  metadata = {
    id: Formatter.Commands.ToolsScreenshot.COMMAND_ID,
  };
  name = 'screenshot';
  nameLocalizations = I18n.localizations('commands.tools.screenshot.name');

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        {
          name: 'url',
          description: 'URL to screenshot',
          ...I18n.optionLocalizations('commands.tools.screenshot.url'),
          required: true,
          value: Parameters.url,
        },
        {
          name: 'width',
          description: 'Page Width',
          ...I18n.optionLocalizations('commands.tools.screenshot.width'),
          type: Number,
        },
        {
          name: 'height',
          description: 'Page Height',
          ...I18n.optionLocalizations('commands.tools.screenshot.height'),
          type: Number,
        },
        {
          name: 'lightmode',
          description: 'Opposite of darkmode',
          ...I18n.optionLocalizations('commands.tools.screenshot.lightmode'),
          type: Boolean,
        },
        {
          name: 'timeout',
          description: 'Max amount of seconds to wait before screenshotting',
          ...I18n.optionLocalizations('commands.tools.screenshot.timeout'),
          type: 'number',
        },
        {
          name: 'wait',
          description: 'Wait time after loading',
          ...I18n.optionLocalizations('commands.tools.screenshot.wait'),
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsScreenshot.CommandArgs) {
    return Formatter.Commands.ToolsScreenshot.createMessage(context, args);
  }
}
