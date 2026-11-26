import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVBigHeadCommand } from './big-head';
import { MediaIVFaceFilterCommand } from './face-filter';


// /media-iv-face is at discord's 25 subcommand limit, newer face effects go here
export default class MediaIVFace2GroupCommand extends BaseSlashCommand {
  description = 'More face effects for an image or video: face filters, big heads';
  descriptionLocalizations = I18n.localizations('commands.media_iv_face_2.description');
  name = 'media-iv-face-2';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new MediaIVBigHeadCommand(),
        new MediaIVFaceFilterCommand(),
      ],
    });
  }
}
