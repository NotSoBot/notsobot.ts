import {
  Command,
  Constants,
  Utils,
} from 'detritus-client';


export default (<Command.CommandOptions> {
  label: 'code',
  name: 'eval',
  args: [
    {default: false, name: 'noreply', type: 'bool'},
    {default: 2, name: 'jsonspacing', type: 'number'},
    {default: false, name: 'files.gg', label: 'upload', type: 'bool'},
  ],
  responseOptional: true,
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args) => {
    const match = Utils.regex(Constants.DiscordRegexNames.TEXT_CODEBLOCK, args.code);
    if (match !== null) {
      args.code = match.text;
    }

    let language = 'js';
    let message: any;
    try {
      message = await Promise.resolve(eval(args.code));
      if (typeof(message) === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch(error) {
      message = (error) ? error.stack || error.message : error;
    }

    const max = 1990 - language.length;
    if (!args.noreply) {
      let content: string;
      if (args.upload) {
        try {
          const upload = await context.rest.request({
            files: [{filename: `eval.${language}`, data: message, name: 'file'}],
            method: 'post',
            url: 'https://api.files.gg/files',
          });
          content = upload.urls.main;
        } catch(error) {
          content = String(error);
        }
      } else {
        content = [
          '```' + language,
          String(message).slice(0, max),
          '```',
        ].join('\n');
      }
      return context.editOrReply(content);
    }
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});
