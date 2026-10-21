import { I18n } from '../../../../utils';


// shared by every `/eyes` subcommand
export const EYES_FLIPPED_OPTION = {
  name: 'flipped',
  description: 'Mirror the eyes horizontally',
  ...I18n.optionLocalizations('commands.options.eyes.flipped'),
  type: Boolean,
};
