/* Blog and media lists that ask the CMS for one cursor page at a time. */

import { MediaGallery, PostList } from "./doctor-sections";
import type { DrMediaItem, DrPost } from "./doctor-sections";
import type { ApiPost, ApiVideo } from "./feed";
import { postRow, usePagedFeed, videoRow } from "./feed";

/* Ten cards is what the index shows before anyone asks for more, so the first paint is the same
   whether the words came from the CMS or from the bundle. */
export const POSTS_PER_PAGE = 10;
export const MEDIA_PER_PAGE = 9;

interface PagedPostsProps {
  seed: DrPost[];
  author: string;
  avatar: Parameters<typeof PostList>[0]["avatar"];
  labels: Parameters<typeof PostList>[0]["labels"];
  olderLabel?: string;
  heading?: string;
}

export function PagedPosts( { seed, author, avatar, labels, olderLabel, heading }: PagedPostsProps ) {
  const feed = usePagedFeed<DrPost>( {
    path: "/api/cms/feed/posts",
    size: POSTS_PER_PAGE,
    seed,
    map: row => postRow( row as unknown as ApiPost ),
  } );

  return (
    <PostList
      posts={ feed.rows }
      author={ author }
      avatar={ avatar }
      labels={ labels }
      heading={ heading }
      page={ { hasMore: feed.hasMore, loading: feed.loading, more: feed.more, label: olderLabel } }
    />
  );
}

interface PagedMediaProps {
  seed: DrMediaItem[];
  kicker: string;
  title: string;
  playLabel?: string;
  moreLabel?: string;
}

export function PagedMedia( { seed, kicker, title, playLabel, moreLabel }: PagedMediaProps ) {
  const feed = usePagedFeed<DrMediaItem>( {
    path: "/api/cms/feed/media",
    size: MEDIA_PER_PAGE,
    seed,
    map: row => videoRow( row as unknown as ApiVideo ),
  } );

  return (
    <MediaGallery
      kicker={ kicker }
      title={ title }
      items={ feed.rows }
      playLabel={ playLabel }
      page={ { hasMore: feed.hasMore, loading: feed.loading, more: feed.more, label: moreLabel } }
    />
  );
}
