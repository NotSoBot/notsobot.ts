import { I18n } from '../../../../utils';


export const FOCUS_OPTIONS = [
  {
    name: 'x',
    description: 'Where to focus across, 0 (left) to 1 (right) (Default: the subject)',
    ...I18n.optionLocalizations('commands.media_iv_depth.focus_x'),
    maxValue: 1,
    minValue: 0,
    type: 'number',
  },
  {
    name: 'y',
    description: 'Where to focus down, 0 (top) to 1 (bottom) (Default: the subject)',
    ...I18n.optionLocalizations('commands.media_iv_depth.focus_y'),
    maxValue: 1,
    minValue: 0,
    type: 'number',
  },
] as const;
