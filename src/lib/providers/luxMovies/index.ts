import {luxGetPosts, luxGetPostsSearch} from './luxGetPosts';
import {doodleGetInfo} from '../doodle/getInfo';
import {doodleGetStream} from '../doodle/getStream';
import {doodleGetEpisodeLinks} from '../doodle/getEpisodesLink';
import {homeList, genresList} from '../doodle/catalog';
import {ProviderType} from '../../Manifest';

export const luxMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  GetMetaData: doodleGetInfo,
  GetHomePosts: luxGetPosts,
  GetStream: doodleGetStream,
  nonStreamableServer: ['filepress'],
  GetEpisodeLinks: doodleGetEpisodeLinks,
  GetSearchPosts: luxGetPostsSearch,
};