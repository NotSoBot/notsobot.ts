import { I18n } from '../../../../utils';


// shared by every `/eyes` subcommand
export const EYES_FLIPPED_OPTION = {
  name: 'flipped',
  description: 'Mirror the eyes horizontally',
  ...I18n.optionLocalizations('commands.options.eyes.flipped'),
  type: Boolean,
};


// `/eyes laser` and `/eyes lightning` get the drawn types, `/eyes default`'s type the sticker ones
export {
  EYES_LASER_TYPES,
  EYES_LIGHTNING_TYPES,
  EYES_STICKER_TYPES,
} from '../../../../utils/formatter/commands/media.iv.manipulation.eyes';
