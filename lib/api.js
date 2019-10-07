"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_rest_1 = require("detritus-rest");
exports.API_URL = 'https://beta.notsobot.com/api';
async function request(context, options) {
    options.url = exports.API_URL;
    options.headers = Object.assign({}, options.headers);
    const token = process.env.NOTSOBOT_API_TOKEN;
    if (token) {
        options.headers.authorization = token;
    }
    options.headers['x-user-id'] = context.userId;
    return context.rest.request(options);
}
exports.request = request;
async function googleContentVisionOCR(context, options) {
    const body = {
        url: options.url,
    };
    return request(context, {
        body,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.POST,
            path: '/google/content-vision/ocr',
        },
    });
}
exports.googleContentVisionOCR = googleContentVisionOCR;
async function googleSearch(context, options) {
    const query = {
        locale: options.locale,
        max_results: options.maxResults,
        query: options.query,
        safe: options.safe,
        show_unknown: options.showUnknown,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/google/search',
        },
    });
}
exports.googleSearch = googleSearch;
async function googleSearchImages(context, options) {
    const query = {
        locale: options.locale,
        max_results: options.maxResults,
        query: options.query,
        safe: options.safe,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/google/search/images',
        },
    });
}
exports.googleSearchImages = googleSearchImages;
async function googleSearchYoutube(context, options) {
    const query = {
        query: options.query,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/google/search/youtube',
        },
    });
}
exports.googleSearchYoutube = googleSearchYoutube;
async function googleTranslate(context, options) {
    const query = {
        from: options.from,
        text: options.text,
        to: options.to,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/google/translate',
        },
    });
}
exports.googleTranslate = googleTranslate;
async function imageResize(context, options) {
    const query = {
        convert: options.convert,
        scale: options.scale,
        size: options.size,
        url: options.url,
    };
    return request(context, {
        dataOnly: false,
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.POST,
            path: '/image/resize',
        },
    });
}
exports.imageResize = imageResize;
async function searchDuckDuckGo(context, options) {
    const query = {
        query: options.query,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/search/duckduckgo',
        },
    });
}
exports.searchDuckDuckGo = searchDuckDuckGo;
async function searchDuckDuckGoImages(context, options) {
    const query = {
        query: options.query,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/search/duckduckgo/images',
        },
    });
}
exports.searchDuckDuckGoImages = searchDuckDuckGoImages;
async function searchUrban(context, options) {
    const query = {
        query: options.query,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/search/urban-dictionary',
        },
    });
}
exports.searchUrban = searchUrban;
async function searchUrbanRandom(context, options = {}) {
    return request(context, {
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/search/urban-dictionary/random',
        },
    });
}
exports.searchUrbanRandom = searchUrbanRandom;
async function searchWolframAlpha(context, options) {
    const query = {
        query: options.query,
    };
    return request(context, {
        query,
        route: {
            method: detritus_rest_1.Constants.HTTPMethods.GET,
            path: '/search/wolfram-alpha',
        },
    });
}
exports.searchWolframAlpha = searchWolframAlpha;
