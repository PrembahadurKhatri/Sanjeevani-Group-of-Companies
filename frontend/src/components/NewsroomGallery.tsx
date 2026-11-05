"use client";

import Image from "next/image";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { getYouTubeId, type GalleryAlbum, type GalleryPhoto, type GalleryVideo } from "@/data/newsroom";
import NewsroomPagination from "@/components/NewsroomPagination";

type Tab = "photos" | "videos";

// Admin uploads may live on another host; next/image only optimises local files.
const remote = (src: string) => /^https?:\/\//.test(src);

// The gallery: a Photos / Videos tab switch, a photo grid that opens a
// full-screen viewer, and a video grid. Used on the Newsroom and Gallery pages
// (and, photos only, on company pages). `renderYouTube` is the Newsroom's own
// click-to-play YouTube player, so every page behaves the same. `pageSize`
// shows that many items first, with a Show more button adding that many again.
// With `albums`, the Photos tab shows one card per album (an event or
// programme); a card opens that album's photos, and a photo opens the viewer,
// which then steps through that album only.
export default function NewsroomGallery({
  renderYouTube,
  photos: galleryPhotos,
  albums = [],
  videos: galleryVideos,
  pageSize,
  heading = "Gallery",
  idPrefix = "gallery",
  photosOnly = false,
}: {
  renderYouTube: (id: string, title: string, thumbnail?: string) => ReactNode;
  photos: GalleryPhoto[];
  albums?: GalleryAlbum[];
  videos: GalleryVideo[];
  pageSize?: number;
  heading?: string;
  idPrefix?: string;
  photosOnly?: boolean;
}) {
  const showAlbums = albums.length > 0;
  const [tab, setTab] = useState<Tab>("photos");
  const effectivePageSize = pageSize ?? Math.max(galleryPhotos.length, albums.length, galleryVideos.length, 1);
  const [photoPage, setPhotoPage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const [albumOpen, setAlbumOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const albumRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const lastAlbumTrigger = useRef<HTMLButtonElement | null>(null);

  const album = albumOpen === null ? null : albums[albumOpen] ?? null;
  // The viewer steps through the open album, or through every photo.
  const viewerPhotos = album ? album.photos : galleryPhotos;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = albumRef.current;
    if (!dialog) return;
    if (albumOpen !== null && !dialog.open) dialog.showModal();
    if (albumOpen === null && dialog.open) dialog.close();
  }, [albumOpen]);

  function step(delta: number) {
    if (viewerPhotos.length === 0) return;
    setOpen((current) => (current === null ? current : (current + delta + viewerPhotos.length) % viewerPhotos.length));
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: Tab = tab === "photos" ? "videos" : "photos";
    setTab(next);
    document.getElementById(`${idPrefix}-tab-${next}`)?.focus();
  }

  const photo = open === null ? null : viewerPhotos[open];
  const photoCount = showAlbums ? albums.reduce((sum, a) => sum + a.photos.length, 0) : galleryPhotos.length;
  const albumStart = (photoPage - 1) * effectivePageSize;
  const visibleAlbums = albums.slice(albumStart, albumStart + effectivePageSize);

  // Every fifth photo spans two columns; the last one does too when that is what
  // it takes to fill the final row of the 3-column grid.
  const baseWide = (index: number) => index % 5 === 0;
  const photoStart = (photoPage - 1) * effectivePageSize;
  const videoStart = (videoPage - 1) * effectivePageSize;
  const visiblePhotos = galleryPhotos.slice(photoStart, photoStart + effectivePageSize);
  const visibleVideos = galleryVideos.slice(videoStart, videoStart + effectivePageSize);
  const visibleCount = visiblePhotos.length;
  const wideCount = visiblePhotos.filter((_, index) => baseWide(index)).length;
  const isWide = (index: number) =>
    baseWide(index) || (index === visibleCount - 1 && (visibleCount + wideCount) % 3 !== 0);

  return (
    <section className="newsroom-group nr-gallery" id={idPrefix} aria-labelledby={`${idPrefix}-title`}>
      <div className="newsroom-group-heading">
        <h2 id={`${idPrefix}-title`}>{heading}</h2>
        {!photosOnly && <div className="nr-tabs" role="tablist" aria-label="Gallery type">
          {(["photos", "videos"] as const).map((value) => (
            <button
              key={value}
              id={`${idPrefix}-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`${idPrefix}-panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={onTabKey}
            >
              {value === "photos" ? "Photos" : "Videos"}
              <span className="num">{value === "photos" ? photoCount : galleryVideos.length}</span>
            </button>
          ))}
        </div>}
      </div>

      <div id={`${idPrefix}-panel-photos`} role={photosOnly ? undefined : "tabpanel"} aria-labelledby={photosOnly ? undefined : `${idPrefix}-tab-photos`} hidden={tab !== "photos"}>
        {showAlbums ? (
          <>
          <ul className="nr-albums">
            {visibleAlbums.map((item, index) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="nr-album"
                  onClick={(event) => { lastAlbumTrigger.current = event.currentTarget; setAlbumOpen(albumStart + index); }}
                  aria-label={`Open album: ${item.title}, ${item.photos.length} ${item.photos.length === 1 ? "photo" : "photos"}`}
                >
                  <span className="nr-album-cover">
                    <Image src={item.photos[0].src} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized={remote(item.photos[0].src)} />
                    <span className="nr-album-count">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="15" height="13" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v11" /></svg>
                      <span className="num">{item.photos.length}</span> {item.photos.length === 1 ? "photo" : "photos"}
                    </span>
                  </span>
                  <span className="nr-album-body">
                    {item.date && <time>{item.date}</time>}
                    <strong>{item.title}</strong>
                    <span className="nr-album-foot">
                      {item.photos.length > 1 && (
                        <span className="nr-album-strip" aria-hidden="true">
                          {item.photos.slice(1, 4).map((p, i) => (
                            <span key={`${p.src}-${i}`}><Image src={p.src} alt="" fill sizes="40px" unoptimized={remote(p.src)} /></span>
                          ))}
                          {item.photos.length > 4 && <span className="nr-album-more num">+{item.photos.length - 4}</span>}
                        </span>
                      )}
                      <span className="nr-album-cta">View album <span aria-hidden="true">→</span></span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <NewsroomPagination page={photoPage} totalItems={albums.length} pageSize={effectivePageSize} onPageChange={setPhotoPage} label="Albums" />
          </>
        ) : galleryPhotos.length ? (
          <>
          <ul className="nr-photos">
            {visiblePhotos.map((item, index) => (
              <li key={`${item.src}-${index}`} className={isWide(index) ? "is-wide" : undefined}>
                <button
                  type="button"
                  className="nr-photo"
                  onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(photoStart + index); }}
                  aria-label={`Open photo: ${item.caption}`}
                >
                  <Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized={remote(item.src)} />
                  <span className="nr-photo-caption">{item.caption}</span>
                </button>
              </li>
            ))}
          </ul>
          <NewsroomPagination page={photoPage} totalItems={galleryPhotos.length} pageSize={effectivePageSize} onPageChange={setPhotoPage} label="Photos" />
          </>
        ) : (
          <p className="newsroom-empty">Photos from across the group will appear here soon.</p>
        )}
      </div>

      {!photosOnly && <div id={`${idPrefix}-panel-videos`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-videos`} hidden={tab !== "videos"}>
        {galleryVideos.length ? (
          <>
          <ul className="nr-videos">
            {visibleVideos.map((video, index) => {
              if (video.kind === "file") {
                return (
                  <li key={`${video.src}-${index}`}>
                    <div className="nr-video">
                      <video controls preload="metadata" poster={video.poster}>
                        <source src={video.src} />
                      </video>
                    </div>
                    <p className="nr-video-title">{video.title}</p>
                  </li>
                );
              }
              const id = getYouTubeId(video.url);
              if (!id) return null;
              return (
                <li key={`${id}-${index}`}>
                  <div className="nr-video newsroom-video">{renderYouTube(id, video.title, video.thumbnail)}</div>
                </li>
              );
            })}
          </ul>
          <NewsroomPagination page={videoPage} totalItems={galleryVideos.length} pageSize={effectivePageSize} onPageChange={setVideoPage} label="Videos" />
          </>
        ) : (
          <p className="newsroom-empty">Videos from across the group will appear here soon.</p>
        )}
      </div>}

      {showAlbums && (
        <dialog
          ref={albumRef}
          className="nr-album-viewer"
          aria-label={album ? `Photo album: ${album.title}` : "Photo album"}
          onClose={() => { setOpen(null); setAlbumOpen(null); lastAlbumTrigger.current?.focus(); }}
          onClick={(event) => { if (event.target === event.currentTarget) setAlbumOpen(null); }}
        >
          {album && (
            <div className="nr-album-sheet">
              <header className="nr-album-head">
                <div>
                  {album.date && <time>{album.date}</time>}
                  <h3>{album.title}</h3>
                  <p><span className="num">{album.photos.length}</span> {album.photos.length === 1 ? "photo" : "photos"}</p>
                </div>
                <button className="nr-album-close" type="button" onClick={() => setAlbumOpen(null)} aria-label="Close album">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </header>
              <ul className="nr-album-photos">
                {album.photos.map((item, index) => (
                  <li key={`${item.src}-${index}`}>
                    <button
                      type="button"
                      className="nr-photo"
                      onClick={(event) => { lastTrigger.current = event.currentTarget; setOpen(index); }}
                      aria-label={`Open photo: ${item.caption}`}
                    >
                      <Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized={remote(item.src)} />
                      <span className="nr-photo-caption">{item.caption}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </dialog>
      )}

      <dialog
        ref={dialogRef}
        className="nr-viewer"
        aria-label="Photo viewer"
        onClose={() => { setOpen(null); lastTrigger.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        {photo && (
          <figure className="nr-viewer-figure">
            <div className="nr-viewer-image">
              <Image src={photo.src} alt={photo.alt} fill sizes="90vw" unoptimized={remote(photo.src)} />
            </div>
            <figcaption>
              <span>{photo.caption}</span>
              <span className="num">{(open ?? 0) + 1} / {viewerPhotos.length}</span>
            </figcaption>
          </figure>
        )}
        <button className="nr-viewer-close" type="button" onClick={() => setOpen(null)} aria-label="Close photo viewer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button className="nr-viewer-nav is-prev" type="button" onClick={() => step(-1)} aria-label="Previous photo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <button className="nr-viewer-nav is-next" type="button" onClick={() => step(1)} aria-label="Next photo">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </dialog>
    </section>
  );
}
