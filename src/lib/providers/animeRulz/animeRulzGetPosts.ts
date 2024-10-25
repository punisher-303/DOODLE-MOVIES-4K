import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
export const animeRulzGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('animerulz');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts(url, signal);
};
export const animeRulzGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('animerulz');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  return posts(url, signal);
};
async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.grid-anime-auto,.kira-grid')
      .children()
      .map((i, element) => {
        const title = $(element).find('a').text() || '';
        const link = $(element).find('a').attr('href') || '';
        const image =
          $(element).find('img').attr('src') ||
          $(element).find('img').attr('srcset') ||
          '';
        // console.log('Rz image ', image);
        // console.log('Rz title ', title.trim());
        // console.log(
        //   'Rz link ',
        //   link.replace('/anime/', '/watch/').slice(0, -1) + '-episode-1',
        // );
        if (title && link) {
          catalog.push({
            title: title.trim(),
            link: link,
            image: image,
          });
        }
      });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('Rz error ', err);
    return [];
  }
}