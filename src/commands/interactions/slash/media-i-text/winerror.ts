import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'winerror';

const SYSTEM_CHOICES = Parameters.Slash.oneOf<string>({
  choices: Formatter.Commands.MediaICreateWinError.WinErrorSystems,
  defaultChoice: Formatter.Commands.MediaICreateWinError.WinErrorSystems.XP,
  descriptions: Formatter.Commands.MediaICreateWinError.WinErrorSystemsToText,
  doNotSort: true,
});

export class MediaIWinErrorCommand extends BaseInteractionCommandOption {
  description = 'Make a fake Windows error message, from Windows 1.0 to 11';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.winerror.description');
  metadata = {
    credits: Formatter.Commands.MediaICreateWinError.CREDITS,
    id: Formatter.Commands.MediaICreateWinError.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.winerror.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'The message',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.text'),
          maxLength: 1000,
          required: true,
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'title',
          description: 'The title bar (Default: Error)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.title'),
          maxLength: 100,
          value: Parameters.string({maxLength: 100}),
        },
        {
          name: 'os',
          description: 'Which Windows (Default: XP)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.os'),
          choices: SYSTEM_CHOICES,
        },
        {
          name: 'icon',
          description: 'error, warning, question or a number from /media-i-text winerror-icons (Default: error)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.icon'),
          maxLength: 8,
          value: Parameters.string({maxLength: 8}),
        },
        {
          name: 'buttons',
          description: 'Up to 3 buttons split by | like Yes|No|Cancel (Default: OK)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.buttons'),
          maxLength: 100,
          value: Parameters.string({maxLength: 100}),
        },
        {
          name: 'default',
          description: 'Which button is focused (Default: 1)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.default'),
          maxValue: 3,
          minValue: 1,
          type: Number,
        },
        {
          name: 'disabled',
          description: 'Buttons drawn greyed out, like 2,3',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.disabled'),
          maxLength: 10,
          value: Parameters.string({maxLength: 10}),
        },
        {
          name: 'no-close',
          description: 'Grey out the close button',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.no_close'),
          label: 'noclose',
          type: Boolean,
        },
        {
          name: 'color',
          description: 'Window color on 1.0 and 8, #hex or r,g,b',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.color'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'gradient',
          description: 'Title bar colors on 95, 98 and 2000, one or two #hex',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.gradient'),
          maxLength: 32,
          value: Parameters.string({maxLength: 32}),
        },
        {
          name: 'scale',
          description: 'Pixel size, 1 to 4 (Default: 1)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror.scale'),
          maxValue: 4,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateWinError.CommandArgs) {
    return Formatter.Commands.MediaICreateWinError.createMessage(context, args);
  }
}


export const ICONS_COMMAND_NAME = 'winerror-icons';

export class MediaIWinErrorIconsCommand extends BaseInteractionCommandOption {
  description = 'Show every numbered icon winerror can use on a Windows version';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.winerror_icons.description');
  metadata = {
    credits: Formatter.Commands.MediaICreateWinError.CREDITS,
    id: Formatter.Commands.MediaICreateWinError.ICONS_COMMAND_ID,
  };
  name = ICONS_COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.winerror_icons.name');

  constructor() {
    super({
      options: [
        {
          name: 'os',
          description: 'Which Windows (Default: XP)',
          ...I18n.optionLocalizations('commands.media_i.fun.winerror_icons.os'),
          choices: SYSTEM_CHOICES,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateWinError.IconsCommandArgs) {
    return Formatter.Commands.MediaICreateWinError.createIconsMessage(context, args);
  }
}
