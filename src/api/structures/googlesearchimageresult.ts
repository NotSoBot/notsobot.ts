import * as moment from 'moment';

import { Collections, Structures } from 'detritus-client';

import {
  GoogleImageVideoTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysGoogleSearchImageResult = new Collections.BaseSet<string>([
  NotSoApiKeys.CREATED,
  NotSoApiKeys.DESCRIPTION,
  NotSoApiKeys.HEADER,
  NotSoApiKeys.FOOTER,
  NotSoApiKeys.ID,
  NotSoApiKeys.IMAGE,
  NotSoApiKeys.PRODUCT,
  NotSoApiKeys.THUMBNAIL,
  NotSoApiKeys.URL,
  NotSoApiKeys.VIDEO,
]);

export class GoogleSearchImageResult extends BaseStructure {
  readonly _keys = keysGoogleSearchImageResult;

  created: null | string = null;
  description: string = '';
  header: string = '';
  footer: string = '';
  id: string = '';
  image!: GoogleSearchImage;
  product: null | GoogleSearchImageProduct = null;
  thumbnail!: GoogleSearchImageThumbnail;
  url: string = '';
  video: null | GoogleSearchImageVideo = null;

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.IMAGE: {
          value = new GoogleSearchImage(this, value);
        }; break;
        case NotSoApiKeys.PRODUCT: {
          if (value) {
            value = new GoogleSearchImageProduct(this, value);
          }
        }; break;
        case NotSoApiKeys.THUMBNAIL: {
          value = new GoogleSearchImageThumbnail(this, value);
        }; break;
        case NotSoApiKeys.VIDEO: {
          if (value) {
            value = new GoogleSearchImageVideo(this, value);
          }
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysGoogleSearchImage = new Collections.BaseSet<string>([
  NotSoApiKeys.EXTENSION,
  NotSoApiKeys.HEIGHT,
  NotSoApiKeys.PROXY_URL,
  NotSoApiKeys.TRUSTED,
  NotSoApiKeys.URL,
  NotSoApiKeys.WIDTH,
]);

export class GoogleSearchImage extends BaseStructure {
  readonly _keys = keysGoogleSearchImage;
  readonly result: GoogleSearchImageResult;

  extension: null | string = null;
  height: number = 0;
  proxyUrl: string = '';
  trusted: boolean = false;
  url: string = '';
  width: number = 0;

  constructor(result: GoogleSearchImageResult, data: Structures.BaseStructureData) {
    super();
    this.result = result;
    this.merge(data);
  }

  get isSVG(): boolean {
    return this.extension === 'svg';
  }
}


const keysGoogleSearchImageProduct = new Collections.BaseSet<string>([
  NotSoApiKeys.BRAND,
  NotSoApiKeys.CURRENCY,
  NotSoApiKeys.DESCRIPTION,
  NotSoApiKeys.IN_STOCK,
  NotSoApiKeys.PRICE,
  NotSoApiKeys.STARS,
  NotSoApiKeys.STARS_AMOUNT,
  NotSoApiKeys.TITLE,
]);

export class GoogleSearchImageProduct extends BaseStructure {
  readonly _keys = keysGoogleSearchImageProduct;
  readonly result: GoogleSearchImageResult;

  brand: null | string = null;
  currency: null | string = null;
  description: string = '';
  inStock: null | boolean = null;
  price: null | number = null;
  stars: null | number = null;
  starsAmount: null | number = null;
  title: string = '';

  constructor(result: GoogleSearchImageResult, data: Structures.BaseStructureData) {
    super();
    this.result = result;
    this.merge(data);
  }
}


const keysGoogleSearchImageThumbnail = new Collections.BaseSet<string>([
  NotSoApiKeys.HEIGHT,
  NotSoApiKeys.PROXY_URL,
  NotSoApiKeys.TRUSTED,
  NotSoApiKeys.URL,
  NotSoApiKeys.WIDTH,
]);

export class GoogleSearchImageThumbnail extends BaseStructure {
  readonly _keys = keysGoogleSearchImageThumbnail;
  readonly result: GoogleSearchImageResult;

  height: number = 0;
  proxyUrl: string = '';
  trusted: boolean = false;
  url: string = '';
  width: number = 0;

  constructor(result: GoogleSearchImageResult, data: Structures.BaseStructureData) {
    super();
    this.result = result;
    this.merge(data);
  }
}


const keysGoogleSearchImageVideo = new Collections.BaseSet<string>([
  NotSoApiKeys.CHANNEL,
  NotSoApiKeys.DESCRIPTION,
  NotSoApiKeys.DURATION,
  NotSoApiKeys.LIKES,
  NotSoApiKeys.TITLE,
  NotSoApiKeys.TYPE,
  NotSoApiKeys.UPLOADED_AT,
  NotSoApiKeys.VIEWS,
]);

export class GoogleSearchImageVideo extends BaseStructure {
  readonly _keys = keysGoogleSearchImageVideo;
  readonly result: GoogleSearchImageResult;

  channel: null | string = null;
  description: string = '';
  duration: null | string = null;
  likes: null | string = null;
  title: string = '';
  type!: GoogleImageVideoTypes;
  uploadedAt: null | number = null;
  views: null | number = null;

  constructor(result: GoogleSearchImageResult, data: Structures.BaseStructureData) {
    super();
    this.result = result;
    this.merge(data);
  }

  get uploadedAtText(): string {
    if (this.uploadedAt) {
      return moment(this.uploadedAt).fromNow();
    }
    return '';
  }
}
