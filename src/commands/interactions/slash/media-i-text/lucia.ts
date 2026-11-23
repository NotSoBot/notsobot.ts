import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs extends Formatter.Commands.MediaICreateLucia.CommandArgs {
  portraitAttachment?: Structures.Attachment,
}

export const COMMAND_NAME = 'lucia';

export class MediaILuciaCommand extends BaseInteractionCommandOption {
  description = 'Make a "Play with Lucia" prompt from GTA 6 asking for your text';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.lucia.description');
  metadata = {
    id: Formatter.Commands.MediaICreateLucia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.lucia.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What Lucia wants to do',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.text'),
          maxLength: Formatter.Commands.MediaICreateLucia.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateLucia.MAX_TEXT_LENGTH}),
        },
        {
          name: 'title',
          description: 'Headline next to the portrait (Default: PLAY WITH LUCIA)',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.title'),
          maxLength: Formatter.Commands.MediaICreateLucia.MAX_TITLE_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateLucia.MAX_TITLE_LENGTH}),
        },
        {
          name: 'name',
          description: 'Who will appreciate it (Default: Lucia)',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.name'),
          maxLength: Formatter.Commands.MediaICreateLucia.MAX_NAME_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateLucia.MAX_NAME_LENGTH}),
        },
        {
          name: 'portrait',
          description: 'Emoji/Media URL/User for the portrait, a GIF or video animates the card (Default: Lucia)',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.portrait'),
          value: Parameters.mediaUrl({audio: false, onlyContent: true}),
        },
        {
          name: 'portrait-attachment',
          description: 'Media File for the portrait, a GIF or video animates the card (Default: Lucia)',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.portrait_attachment'),
          label: 'portraitAttachment',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    // the option comes back as the resolved attachment, an uploaded file goes before what `portrait` names
    const attachment = args.portraitAttachment;
    const portrait = (attachment) ? (attachment.url || attachment.proxyUrl || undefined) : args.portrait;
    return Formatter.Commands.MediaICreateLucia.createMessage(context, {...args, portrait});
  }
}
