export type Tag = {
  id: number;
  name: string;
  emoji: string;
  /* Reserved for Year in Pixels. */
  color: string;
  /* 0 or 1, because IndexedDB cannot index booleans. */
  isArchived: 0 | 1;
  createdAt: number;
};

export type Entry = {
  id: number;
  /* Local calendar day as YYYY-MM-DD, so it never shifts with time zones. */
  date: string;
  title: string;
  body: string;
  tagIds: number[];
  /* Epoch milliseconds, which are UTC by definition. */
  createdAt: number;
  updatedAt: number;
};

export type Movie = {
  id: number;
  /* null for movies added by hand. */
  tmdbId: number | null;
  title: string;
  year: number | null;
  overview: string;
  /* Path on TMDB's image server, kept so the poster can be shown online. */
  posterPath: string | null;
  /* The poster itself as a data URL, so it also shows offline and in backups. */
  posterData: string | null;
  createdAt: number;
  /* When the details were last copied from TMDB, null for manual movies. */
  fetchedAt: number | null;
};

export type MovieLog = {
  id: number;
  movieId: number;
  /* Stars from 0.5 to 5 in steps of 0.5. */
  rating: number;
  opinion: string;
  /* Local calendar day as YYYY-MM-DD. */
  watchedDate: string;
  createdAt: number;
  updatedAt: number;
};

/* A picture added to an entry. The entry text points at it as ![name](image:ID). */
export type StoredImage = {
  id: number;
  name: string;
  /* MIME type, for example image/webp. */
  type: string;
  width: number;
  height: number;
  data: ArrayBuffer;
  createdAt: number;
};
