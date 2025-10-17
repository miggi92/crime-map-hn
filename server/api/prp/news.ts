import { parseString } from 'xml2js';

export default defineEventHandler(async (event) => {
  const rssUrl = 'https://www.presseportal.de/rss/dienststelle_110971.rss2'

  try {
    // RSS-Feed abrufen
    const responseXML = await $fetch(rssUrl)

    let jsonData: string = '';
    parseString(responseXML as string, (err, result) => {
      if (err) {
        throw createError({
          statusCode: 500,
          data: err,
          statusMessage: 'Error parsing RSS feed',
        });
      }
      jsonData = result;
    });
    return jsonData.rss.channel[0];
  } catch (error) {
    throw createError({
      statusCode: 500,
      data: error,
      statusMessage: 'Error fetching RSS feed',
    })
  }
});
