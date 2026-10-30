import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';


// shared by the subcommands that edit one face, it gets followed through the frames
export const FACE_OPTION = {
  name: 'face',
  description: 'Face Number, the One drawfaces Shows (0..99) (Default: the Biggest Face)',
  ...I18n.optionLocalizations('commands.options.media.face'),
  type: ApplicationCommandOptionTypes.INTEGER,
  minValue: 0,
  maxValue: 99,
};
