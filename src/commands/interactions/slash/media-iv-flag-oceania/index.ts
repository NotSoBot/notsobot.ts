import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagAustraliaCommand } from './australia';
import { MediaIVFlagFijiCommand } from './fiji';
import { MediaIVFlagKiribatiCommand } from './kiribati';
import { MediaIVFlagMarshallIslandsCommand } from './marshallislands';
import { MediaIVFlagMicronesiaCommand } from './micronesia';
import { MediaIVFlagNauruCommand } from './nauru';
import { MediaIVFlagNewZealandCommand } from './newzealand';
import { MediaIVFlagPalauCommand } from './palau';
import { MediaIVFlagPapuaNewGuineaCommand } from './papuanewguinea';
import { MediaIVFlagSamoaCommand } from './samoa';
import { MediaIVFlagSolomonIslandsCommand } from './solomonislands';
import { MediaIVFlagTongaCommand } from './tonga';
import { MediaIVFlagTuvaluCommand } from './tuvalu';
import { MediaIVFlagVanuatuCommand } from './vanuatu';


export default class MediaIVFlagOceaniaGroupCommand extends BaseSlashCommand {
  description = 'Put Oceanian flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_oceania.description');
  name = 'media-iv-flag-oceania';

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
        new MediaIVFlagAustraliaCommand(),
        new MediaIVFlagFijiCommand(),
        new MediaIVFlagKiribatiCommand(),
        new MediaIVFlagMarshallIslandsCommand(),
        new MediaIVFlagMicronesiaCommand(),
        new MediaIVFlagNauruCommand(),
        new MediaIVFlagNewZealandCommand(),
        new MediaIVFlagPalauCommand(),
        new MediaIVFlagPapuaNewGuineaCommand(),
        new MediaIVFlagSamoaCommand(),
        new MediaIVFlagSolomonIslandsCommand(),
        new MediaIVFlagTongaCommand(),
        new MediaIVFlagTuvaluCommand(),
        new MediaIVFlagVanuatuCommand(),
      ],
    });
  }
}
