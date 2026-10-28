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
