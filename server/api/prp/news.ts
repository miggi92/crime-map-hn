import { parseString } from 'xml2js';

export interface RssNews {
  guid: string;
  title: string;
  description?: string;
  content?: string;
  link?: string;
  date?: string;
  authors?: [{
    name: string;
    description?: string;
    avatar?: {
      src: string;
      alt: string;
    }
  }];
}

export default defineEventHandler(async (event) => {
  const rssUrl = 'https://www.presseportal.de/rss/dienststelle_110971.rss2'

  try {
    // RSS-Feed abrufen
    const responseXML = await $fetch(rssUrl)

    let jsonData: string = '';
    parseString(responseXML as string, (err, result) => {
      if (err) {
        console.error(err);
        throw createError({
          statusCode: 500,
          data: undefined,
          statusMessage: 'Error parsing RSS feed',
        });
      }
      jsonData = result;
    });

    const channel = jsonData.rss.channel[0];
    const items: RssNews[] = channel.item.map((item: any) => ({
      title: item.title[0],
      description: item.description ? item.description[0] : '',
      content: item['content:encoded'] ? item['content:encoded'][0] : '',
      link: item.link ? item.link[0] : '',
      date: item.pubDate ? item.pubDate[0] : '',
      authors: [{
        name: channel.category[0] || 'Presseportal.de',
        description: item.author ? item.author[0] : '',
        avatar: {
          src: 'https://www.presseportal.de/favicon.ico',
          alt: item.author ? item.author[0] : ''
        }
      }]
    }));

    return { ...channel, item: items };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      data: undefined,
      statusMessage: 'Error fetching RSS feed',
    })
  }
});
