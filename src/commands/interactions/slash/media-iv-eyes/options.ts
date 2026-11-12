import { MediaEyeTypes } from '../../../../constants';
import { I18n } from '../../../../utils';


// shared by every `/eyes` subcommand
export const EYES_FLIPPED_OPTION = {
  name: 'flipped',
  description: 'Mirror the eyes horizontally',
  ...I18n.optionLocalizations('commands.options.eyes.flipped'),
  type: Boolean,
};


// the drawn eye types get their own `/eyes laser` and `/eyes lightning` with a color, `/eyes default`'s type keeps the
// sticker ones (all of them together are over discord's 25 choices)
function eyeTypesStartingWith(prefix: string): Record<string, MediaEyeTypes> {
  return Object.fromEntries(Object.entries(MediaEyeTypes).filter(([key]) => key.startsWith(prefix)));
}

export const EYES_LASER_TYPES = eyeTypesStartingWith('LASER_');
export const EYES_LIGHTNING_TYPES = eyeTypesStartingWith('LIGHTNING_');
export const EYES_STICKER_TYPES = Object.fromEntries(
  Object.entries(MediaEyeTypes).filter(([key]) => !(key in EYES_LASER_TYPES) && !(key in EYES_LIGHTNING_TYPES)),
) as Record<string, MediaEyeTypes>;
