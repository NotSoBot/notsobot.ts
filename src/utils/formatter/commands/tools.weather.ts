import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesWeather } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors, MeasurementUnits } from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'tools.weather';

export interface CommandArgs {
  isEphemeral?: boolean,
  query: string,
  units?: MeasurementUnits,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { location, timezone, thumbnail, weather } = await utilitiesWeather(context, {
    query: args.query,
    units: args.units,
  });

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = 'OpenWeather';
  payload.footerIconUrl = EmbedBrands.OPEN_WEATHER_MAP;
  payload.url = location.urls.place;

  {
    let title: string;
    if (location.name_official && location.name_official !== location.name && !location.name_official.toLowerCase().includes(location.name.toLowerCase())) {
      title = `${location.name_official} (${location.name})`;
    } else {
      title = location.name;
    }
    payload.title = title;
  }

  const { current, units } = weather;
  {
    const lines: Array<string> = [];
    {
      let text = translate('tools_weather.currently', {temperature: current.temperature, unitTextForTemperature: unitTextForTemperature(units)});
      if (current.conditions.length) {
        text = `${text} with ${current.conditions.map((x) => toTitleCase(x.description)).join(', ')}`;
      }
      lines.push(translate('tools_weather.feels_like', {feels_like: current.feels_like, text: text, unitTextForTemperature: unitTextForTemperature(units)}));
    }

    lines.push(displayDetailsLine([
      translate('tools_weather.humidity', {humidity: current.humidity}),
      translate('tools_weather.cloud_coverage', {clouds: current.clouds}),
      translate('tools_weather.uv_index', {uv_index: current.uv_index}),
    ]));
    if (current.wind) {
      const beaufortScale = speedToBeaufortScale(current.wind.speed, units);
      lines.push(displayDetailsLine([
        translate('tools_weather.wind', {degreesToDirection: degreesToDirection(current.wind.direction), speed: current.wind.speed, unitTextForSpeed: unitTextForSpeed(units)}),
        translate('tools_weather.wind_feels', {description: beaufortScale.description, value: toTitleCase(beaufortScale.text)}),
      ]));
    }
    lines.push(displayDetailsLine([
      (current.dew_point) && translate('tools_weather.dew_point', {dew_point: current.dew_point, unitTextForTemperature: unitTextForTemperature(units)}),
      (current.pressure) && translate('tools_weather.atmospheric_pressure_hpa', {pressure: current.pressure}),
      translate('tools_weather.visibility_km', {visibility: current.visibility}),
    ]));
    {
      const coordinates = `${location.latitude}, ${location.longitude}`;
      lines.push(`-# ${translate('tools_weather.coordinates', {coordinates: Markup.url(coordinates, location.urls.place)})}`);
    }

    payload.description = displayDetails(lines);
    // add sunrise, sunset
  }

  if (thumbnail) {
    payload.thumbnail = thumbnail.url;
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral});
}



function unitTextForSpeed(units: MeasurementUnits) {
  switch (units) {
    case MeasurementUnits.IMPERIAL: return 'mph';
    case MeasurementUnits.METRIC: return 'm/s';
  }
  return 'N/A';
}


function unitTextForTemperature(units: MeasurementUnits) {
  switch (units) {
    case MeasurementUnits.IMPERIAL: return '°F';
    case MeasurementUnits.METRIC: return '°C';
  }
  return 'N/A';
}


const BEAUFORT_SCALE = [
  {min: 0.0, max: 0.3, text: "Calm", description: "Smoke rises straight up without any drift."},
  {min: 0.3, max: 1.6, text: "Very light", description: "Smoke shows wind direction. Leaves barely move."},
  {min: 1.6, max: 3.4, text: "Light", description: "Wind felt on face. Leaves rustle gently."},
  {min: 3.4, max: 5.5, text: "Moderate", description: "Leaves and small twigs move constantly."},
  {min: 5.5, max: 8.0, text: "Fair", description: "Small branches sway. Dust and paper lifted."},
  {min: 8.0, max: 10.8, text: "Strong", description: "Small trees sway. Wavelets form on water."},
  {min: 10.8, max: 13.9, text: "High", description: "Large branches move. Difficult to use umbrella."},
  {min: 13.9, max: 17.2, text: "Very strong", description: "Whole trees in motion. Hard to walk against wind."},
  {min: 17.2, max: 20.7, text: "Gale force", description: "Twigs break. Cars veer on roads."},
  {min: 20.8, max: 24.5, text: "Storm force", description: "Small trees uprooted. Minor structural damage."},
  {min: 24.5, max: 28.5, text: "Violent storm", description: "Trees uprooted. Significant structural damage."},
  {min: 28.5, max: 32.7, text: "Hurricane force", description: "Widespread damage. Vehicles blown off road."},
  {min: 32.7, max: 64.0, text: "Extreme hurricane", description: "Severe and extensive structural damage."},
];


function speedToBeaufortScale(speed: number, units: MeasurementUnits) {
  switch (units) {
    case MeasurementUnits.IMPERIAL: {
      speed = speed / 2.237;
    }; break;
  }

  return BEAUFORT_SCALE.find((x) => {
    return (x.min <= speed && speed <= x.max);
  }) || BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1]; // default to the highest one
}



const WIND_SPEEDS = [
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'light air', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
  {min: 0.0, max: 0.3, text: 'calm', description: '0-1   Smoke rises straight up'},
]


const METEOROLOGICAL_DIRECTIONS = [
  { min: 348.75, max: 360, text: 'N' },
  { min: 0, max: 11.25, text: 'N' },
  { min: 11.25, max: 33.75, text: 'NNE' },
  { min: 33.75, max: 56.25, text: 'NE' },
  { min: 56.25, max: 78.75, text: 'ENE' },
  { min: 78.75, max: 101.25, text: 'E' },
  { min: 101.25, max: 123.75, text: 'ESE' },
  { min: 123.75, max: 146.25, text: 'SE' },
  { min: 146.25, max: 168.75, text: 'SSE' },
  { min: 168.75, max: 191.25, text: 'S' },
  { min: 191.25, max: 213.75, text: 'SSW' },
  { min: 213.75, max: 236.25, text: 'SW' },
  { min: 236.25, max: 258.75, text: 'WSW' },
  { min: 258.75, max: 281.25, text: 'W' },
  { min: 281.25, max: 303.75, text: 'WNW' },
  { min: 303.75, max: 326.25, text: 'NW' },
  { min: 326.25, max: 348.75, text: 'NNW' }
];

function degreesToDirection(degrees: number) {
  degrees = ((degrees % 360) + 360) % 360;
  const direction = METEOROLOGICAL_DIRECTIONS.find((x) => {
    return (x.min <= degrees && degrees < x.max) || (x.max < x.min && (x.min <= degrees || degrees < x.max));
  });
  return (direction) ? direction.text : 'N/A';
}
