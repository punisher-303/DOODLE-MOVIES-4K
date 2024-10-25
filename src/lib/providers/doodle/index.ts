import {doodleGetInfo} from './getInfo';
import {doodleGetStream} from './getStream';
import {doodleGetEpisodeLinks} from './getEpisodesLink';
import {doodleGetPosts, doodleGetPostsSearch} from './getPosts';
import {homeList, genresList} from './catalog';
import {ProviderType} from '../../Manifest';

export const doodleMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  GetMetaData: doodleGetInfo,
  GetHomePosts: doodleGetPosts,
  GetStream: doodleGetStream,
  nonStreamableServer: ['filepress'],
  GetEpisodeLinks: doodleGetEpisodeLinks,
  GetSearchPosts: doodleGetPostsSearch,
};