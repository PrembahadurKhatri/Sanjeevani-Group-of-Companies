// Adds clearly labelled DEMO newsroom content (news, press releases, events,
// notices and a photo gallery) for previewing the site. Every title starts with
// "DEMO:" and every summary says it is sample content. Safe to re-run.
//
// Run: npx tsx --env-file=.env.local scripts/seed-demo-newsroom.ts

import { PrismaClient, type NewsType } from "@prisma/client";
import { guessMimeType, localMediaKey, slugify } from "../prisma/seed-helpers";

const prisma = new PrismaClient();
const NOTE = "Demo content for previewing the site. Not a real announcement.";

async function media(url: string, altText: string) {
  const storageKey = localMediaKey(url);
  const asset = await prisma.mediaAsset.upsert({
    where: { storageKey },
    update: {},
    create: { provider: "LOCAL", storageKey, url, kind: "IMAGE", mimeType: guessMimeType(storageKey), altText },
  });
  return asset.id;
}

async function article(type: NewsType, title: string, excerpt: string, image: string, publishAt: Date | null) {
  const slug = `demo-${slugify(title)}`;
  const data = {
    type,
    title,
    excerpt,
    coverImageId: await media(image, title),
    status: "PUBLISHED" as const,
    publishedAt: publishAt ?? new Date(),
    publishAt,
  };
  await prisma.newsArticle.upsert({ where: { slug }, update: data, create: { slug, ...data } });
}

async function event(title: string, summary: string, venue: string, startsAt: Date, image: string) {
  const slug = `demo-${slugify(title)}`;
  const data = {
    title,
    summary,
    venue,
    startsAt,
    coverImageId: await media(image, title),
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
  };
  await prisma.event.upsert({ where: { slug }, update: data, create: { slug, ...data } });
}

async function notice(title: string, body: string, noticeDate: Date) {
  const existing = await prisma.notice.findFirst({ where: { title } });
  const data = { title, body, noticeDate, status: "PUBLISHED" as const, publishedAt: new Date() };
  if (existing) await prisma.notice.update({ where: { id: existing.id }, data });
  else await prisma.notice.create({ data });
}

async function gallery(title: string, photos: { url: string; caption: string }[]) {
  const slug = `demo-${slugify(title)}`;
  const gallery = await prisma.gallery.upsert({
    where: { slug },
    update: { title, status: "PUBLISHED", publishedAt: new Date() },
    create: { slug, title, status: "PUBLISHED", publishedAt: new Date() },
  });
  await prisma.galleryItem.deleteMany({ where: { galleryId: gallery.id } });
  for (const [index, photo] of photos.entries()) {
    await prisma.galleryItem.create({
      data: { galleryId: gallery.id, mediaId: await media(photo.url, photo.caption), caption: photo.caption, altText: photo.caption, sortOrder: index },
    });
  }
}

async function youtube(title: string, url: string, thumbnail: string, sortOrder: number) {
  const existing = await prisma.video.findFirst({ where: { title, placement: "NEWSROOM_YOUTUBE" } });
  const data = {
    title,
    provider: "YOUTUBE" as const,
    url,
    thumbnailId: await media(thumbnail, title),
    placement: "NEWSROOM_YOUTUBE" as const,
    sortOrder,
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
  };
  if (existing) await prisma.video.update({ where: { id: existing.id }, data });
  else await prisma.video.create({ data });
}

async function main() {
  await article("PRESS_RELEASE", "DEMO: Sample press release, new outpatient wing", NOTE, "/hospital.jpg", new Date("2026-10-15"));
  await article("PRESS_RELEASE", "DEMO: Sample press release, scholarship programme", NOTE, "/education.jpg", new Date("2026-10-01"));
  await article("NEWS", "DEMO: Sample news, community health camp", NOTE, "/aama.jpg", new Date("2026-10-20"));
  await article("NEWS", "DEMO: Sample news, solar panels installed", NOTE, "/hydro.png", new Date("2026-10-08"));

  await event("DEMO: Sample event, community health camp", NOTE, "Demo venue, Pokhara", new Date("2026-12-05T04:15:00Z"), "/aama.jpg");
  await event("DEMO: Sample event, open day for students", NOTE, "Demo venue, Kathmandu", new Date("2026-12-12T04:15:00Z"), "/education.jpg");

  await notice("DEMO: Sample notice, office hours update", NOTE, new Date("2026-11-05"));
  await notice("DEMO: Sample notice, holiday closure", NOTE, new Date("2026-11-20"));

  await gallery("DEMO: Sample photo gallery", [
    { url: "/hospital.jpg", caption: "Demo photo: hospital" },
    { url: "/medical%20college.jpg", caption: "Demo photo: medical college" },
    { url: "/hydro.png", caption: "Demo photo: hydropower" },
    { url: "/construction.jpg", caption: "Demo photo: construction" },
  ]);
  await gallery("DEMO: Sample album, community health camp", [
    { url: "/aama.jpg", caption: "Demo photo: welcoming visitors" },
    { url: "/impact/impact.jpg", caption: "Demo photo: in the community" },
    { url: "/key%20factor/healthcare.jpg", caption: "Demo photo: health check-ups" },
    { url: "/hospital.jpg", caption: "Demo photo: hospital team" },
    { url: "/education.jpg", caption: "Demo photo: health awareness session" },
  ]);
  await gallery("DEMO: Sample album, hydropower site visit", [
    { url: "/hydro.png", caption: "Demo photo: the project site" },
    { url: "/key%20factor/hydro.jpg", caption: "Demo photo: spillway" },
    { url: "/construction.png", caption: "Demo photo: construction progress" },
    { url: "/agro.png", caption: "Demo photo: nearby farmland" },
  ]);

  const video = "https://youtu.be/RqQ0nrcOzQk";
  await youtube("DEMO: Sample video 1", video, "/hospital.jpg", 0);
  await youtube("DEMO: Sample video 2", video, "/education.jpg", 1);
  await youtube("DEMO: Sample video 3", video, "/hydro.png", 2);

  console.log("Demo newsroom content added.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
