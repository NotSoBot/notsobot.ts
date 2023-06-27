import moment from 'moment';

import { Collections, Structures } from 'detritus-client';

import {
  GoogleImageVideoTypes,
  NotSoApiKeys,
} from '../../constants';

import { BaseStructure } from './basestructure';


const keysGoogleSearchImageResult = new Collections.BaseSet<string>([
  NotSoApiKeys.COLOR,
  NotSoApiKeys.CREATED,
  NotSoApiKeys.DESCRIPTION,
  NotSoApiKeys.HEADER,
  NotSoApiKeys.FOOTER,
  NotSoApiKeys.ID,
  NotSoApiKeys.IMAGE,
  NotSoApiKeys.METADATA,
  NotSoApiKeys.THUMBNAIL,
  NotSoApiKeys.URL,
]);

export class GoogleSearchImageResult extends BaseStructure {
  readonly _keys = keysGoogleSearchImageResult;

  color: number = 0;
  created: null | string = null;
  description: string = '';
  header: string = '';
  footer: string = '';
  id: string = '';
  image!: GoogleSearchImage;
  metadata!: {
    license: null | GoogleSearchImageLicense,
    product: null | GoogleSearchImageProduct,
    recipe: null | GoogleSearchImageRecipe,
    video: null | GoogleSearchImageVideo,
  }
  thumbnail!: GoogleSearchImageThumbnail;
  url: string = '';

  constructor(data: Structures.BaseStructureData) {
    super();
    this.merge(data);
  }

  get imageUrl(): string {
    if (this.image.isRawImage || this.image.isSVG || !this.image.extension) {
      return this.thumbnail.url;
    }
    return this.image.url;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case NotSoApiKeys.IMAGE: {
          value = new GoogleSearchImage(this, value);
        }; break;
        case NotSoApiKeys.METADATA: {
          value = {
            license: value.license && new GoogleSearchImageLicense(this, value.license),
            product: value.product && new GoogleSearchImageProduct(this, value.product),
            recipe: value.recipe && new GoogleSearchImageRecipe(this, value.recipe),
            video: value.video && new GoogleSearchImageVideo(this, value.video),
          };
        }; break;
        case NotSoApiKeys.THUMBNAIL: {
          value = new GoogleSearchImageThumbnail(this, value);
        }; break;
      }
    }
    return super.mergeValue(key, value);
  }
}


const keysGoogleSearchImage = new Collections.BaseSet<string>([
  NotSoApiKeys.EXTENSION,
  NotSoApiKeys.HEIGHT,
  NotSoApiKeys.IS_RAW_IMAGE,
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
  isRawImage: boolean = false;
  proxyUrl: null | string = null;
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


const keysGoogleSearchImageLicense = new Collections.BaseSet<string>([
  NotSoApiKeys.ABOUT,
  NotSoApiKeys.LICENSABLE,
  NotSoApiKeys.TEXT,
  NotSoApiKeys.URL,
]);

export class GoogleSearchImageLicense extends BaseStructure {
  readonly _keys = keysGoogleSearchImageLicense;
  readonly result: GoogleSearchImageResult;

  about: string = '';
  licensable: boolean = false;
  text: string = '';
  url: string = '';

  constructor(result: GoogleSearchImageResult, data: Structures.BaseStructureData) {
    super();
    this.result = result;
    this.merge(data);
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


const keysGoogleSearchImageRecipe = new Collections.BaseSet<string>([
  NotSoApiKeys.DESCRIPTION,
  NotSoApiKeys.DURATION,
  NotSoApiKeys.INGREDIENTS,
  NotSoApiKeys.SERVINGS,
  NotSoApiKeys.STARS,
  NotSoApiKeys.STARS_AMOUNT,
  NotSoApiKeys.TITLE,
]);

export class GoogleSearchImageRecipe extends BaseStructure {
  readonly _keys = keysGoogleSearchImageRecipe;
  readonly result: GoogleSearchImageResult;

  description: string = '';
  duration: string = '';
  ingredients: Array<string> = [];
  servings: null | string = null;
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
  likes: null | number = null;
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
