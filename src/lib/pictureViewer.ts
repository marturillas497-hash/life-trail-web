/*
Pictures inside entries are drawn by the editor, outside React. When one is pressed
it announces itself with this event, and PictureViewer shows it in the same full screen
viewer the movie posters use.
*/
export const OPEN_PICTURE_EVENT = "life-trail:open-picture";

export type OpenPictureDetail = { url: string; alt: string };

export function openPicture(detail: OpenPictureDetail): void {
  window.dispatchEvent(new CustomEvent<OpenPictureDetail>(OPEN_PICTURE_EVENT, { detail }));
}
