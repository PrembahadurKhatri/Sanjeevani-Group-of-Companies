export type NewsroomStory = {
  image: string;
  alt: string;
  date: string;
  title: string;
  summary: string;
  link?: string;
  location?: string;
};

export type CompanyNotice = {
  company: string;
  date: string;
  title: string;
  href?: string;
};

// TODO: replace these sample press releases with real ones (newest first).
export const latestPressReleases: NewsroomStory[] = [
  {
    image: "/hospital.jpg",
    alt: "Sanjeevani hospital",
    date: "November 2026",
    title: "Sanjeevani Hospital expands specialist services",
    summary: "New departments bring more specialist care closer to patients in the region.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
  {
    image: "/medical%20college.jpg",
    alt: "Sanjeevani medical college campus",
    date: "October 2026",
    title: "Medical college opens admissions for the new academic year",
    summary: "Applications are now open for undergraduate and postgraduate medical programmes.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
  {
    image: "/hydro.png",
    alt: "Sanjeevani hydropower project",
    date: "September 2026",
    title: "Progress update on our hydropower project",
    summary: "Construction milestones reached as the project moves towards generation.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { image: "/aama.jpg", alt: "Sample press release: new outpatient wing", date: "August 2026", title: "Sample press release: new outpatient wing", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/education.jpg", alt: "Sample press release: scholarship programme", date: "July 2026", title: "Sample press release: scholarship programme", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/hydro.png", alt: "Sample press release: hydropower milestone", date: "June 2026", title: "Sample press release: hydropower milestone", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/edu.jpg", alt: "Sample press release: agro export partnership", date: "May 2026", title: "Sample press release: agro export partnership", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/hydro.jpg", alt: "Sample press release: nursing college accreditation", date: "April 2026", title: "Sample press release: nursing college accreditation", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/hospital.jpg", alt: "Sample press release: community health drive", date: "March 2026", title: "Sample press release: community health drive", summary: "Sample press release for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
];

// SAMPLE news stories added to test Show more; remove when real news is published.
export const latestNews: NewsroomStory[] = [
  { image: "/key%20factor/construction.jpg", alt: "Sample news: new MRI service starts", date: "August 2026", title: "Sample news: new MRI service starts", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/aama.jpg", alt: "Sample news: students win quiz contest", date: "July 2026", title: "Sample news: students win quiz contest", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/education.jpg", alt: "Sample news: road access to project site", date: "June 2026", title: "Sample news: road access to project site", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/hydro.png", alt: "Sample news: new academic session begins", date: "May 2026", title: "Sample news: new academic session begins", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/edu.jpg", alt: "Sample news: hospital adds ICU beds", date: "April 2026", title: "Sample news: hospital adds ICU beds", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/hydro.jpg", alt: "Sample news: staff training week", date: "March 2026", title: "Sample news: staff training week", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/hospital.jpg", alt: "Sample news: solar panels installed", date: "February 2026", title: "Sample news: solar panels installed", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/agro.png", alt: "Sample news: library upgraded", date: "January 2026", title: "Sample news: library upgraded", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/healthcare.jpg", alt: "Sample news: new ambulance service", date: "December 2025", title: "Sample news: new ambulance service", summary: "Sample news story for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
];

// TODO: replace these sample events with real ones (newest first).
export const latestEvents: NewsroomStory[] = [
  {
    image: "/education.jpg",
    alt: "Students at a Sanjeevani Group college",
    date: "November 2026",
    title: "Annual convocation and academic awards",
    summary: "Graduates from our medical and academic colleges are honoured alongside faculty and families.",
  },
  {
    image: "/hospital.jpg",
    alt: "Sanjeevani hospital building",
    date: "October 2026",
    title: "Free community health camp",
    summary: "Doctors from our hospitals offer free check-ups and health advice to local communities.",
  },
  {
    image: "/agro.png",
    alt: "Sanjeevani agro farm",
    date: "September 2026",
    title: "Farmers' outreach programme",
    summary: "Our agro companies share modern farming practices with farmers across the region.",
  },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { image: "/hydro.png", alt: "Sample event: annual sports week", date: "August 2026", title: "Sample event: annual sports week", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/edu.jpg", alt: "Sample event: blood donation camp", date: "July 2026", title: "Sample event: blood donation camp", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/hydro.jpg", alt: "Sample event: farmers' fair", date: "June 2026", title: "Sample event: farmers' fair", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/hospital.jpg", alt: "Sample event: medical conference", date: "May 2026", title: "Sample event: medical conference", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/agro.png", alt: "Sample event: tree plantation day", date: "April 2026", title: "Sample event: tree plantation day", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
  { image: "/key%20factor/healthcare.jpg", alt: "Sample event: alumni meet", date: "March 2026", title: "Sample event: alumni meet", summary: "Sample event for testing the newsroom. Replace it with a real one in Admin \u2192 Newsroom." },
];

// TODO: add YouTube videos here (newest first). Paste any YouTube link: watch, youtu.be or shorts.
// Example: { url: "https://www.youtube.com/watch?v=VIDEO_ID", title: "Video title", thumbnail: "/photo.jpg" },
// thumbnail is optional; without it YouTube's own thumbnail is shown.
export const youtubeVideos: { url: string; title: string; thumbnail?: string }[] = [
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/aama.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/hospital.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/medical%20college.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/education.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/agro.png" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/construction.jpg" },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 7: replace with a group video", thumbnail: "/hospital.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 8: replace with a group video", thumbnail: "/education.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 9: replace with a group video", thumbnail: "/construction.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 10: replace with a group video", thumbnail: "/key%20factor/healthcare.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 11: replace with a group video", thumbnail: "/key%20factor/edu.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Sample video 12: replace with a group video", thumbnail: "/key%20factor/construction.jpg" },
];

export function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

// TODO: replace these sample notices with real ones from each company (newest first).
export const companyNotices: CompanyNotice[] = [
  {
    company: "Nepalgunj Medical College",
    date: "November 2026",
    title: "Entrance exam schedule published",
  },
  {
    company: "Sanjeevani Hospital, Nepalgunj",
    date: "November 2026",
    title: "OPD hours extended on weekdays",
  },
  {
    company: "Mount Everest Boarding School",
    date: "October 2026",
    title: "Admissions open for the new session",
  },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { company: "Sanjeevani Hospital, Pokhara", date: "August 2026", title: "Sample notice 4: replace with a real notice" },
  { company: "Gandaki Medical College", date: "July 2026", title: "Sample notice 5: replace with a real notice" },
  { company: "Om Agro", date: "June 2026", title: "Sample notice 6: replace with a real notice" },
  { company: "Laughing Budha Hydro Power", date: "May 2026", title: "Sample notice 7: replace with a real notice" },
  { company: "Universal Medical College", date: "April 2026", title: "Sample notice 8: replace with a real notice" },
  { company: "Khilung Kalika Construction", date: "March 2026", title: "Sample notice 9: replace with a real notice" },
];

// Newsroom gallery: the Photos and Videos tabs below the YouTube section.
// TODO: these use photos already on the site as placeholders. Put new photos
// in public/gallery/ and list them here, newest first. `caption` is shown
// under the photo and in the full-screen viewer.
export type GalleryPhoto = { src: string; alt: string; caption: string };

export const galleryPhotos: GalleryPhoto[] = [
  { src: "/business/business.png", alt: "Aerial view of a Sanjeevani Group hospital campus", caption: "Hospital campus from above" },
  { src: "/key%20factor/medical.jpg", alt: "Doctors and students at a clinical training session", caption: "Clinical skills training" },
  { src: "/key%20factor/edu.jpg", alt: "School children standing beside a yellow school bus", caption: "Students on their way to class" },
  { src: "/impact/impact.jpg", alt: "Smiling woman working in green hillside fields", caption: "In the fields" },
  { src: "/key%20factor/construction.jpg", alt: "Worker on concrete formwork at a construction site", caption: "On site with the construction team" },
  { src: "/key%20factor/hydro.jpg", alt: "Water rushing through a hydropower dam spillway", caption: "Hydropower spillway" },
  { src: "/leaderhero/leader.jpg", alt: "Sanjeevani Group leadership seated together at a table", caption: "Group leadership meeting" },
  { src: "/aboutus/mission.png", alt: "Engineers in hard hats reviewing plans on a laptop", caption: "Engineers reviewing project plans" },
  { src: "/key%20factor/healthcare.jpg", alt: "Front of the teaching hospital building", caption: "Teaching hospital" },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { src: "/medical%20college.jpg", alt: "Sample gallery photo 10", caption: "Sample photo 10" },
  { src: "/key%20factor/healthcare.jpg", alt: "Sample gallery photo 11", caption: "Sample photo 11" },
  { src: "/key%20factor/hydro.jpg", alt: "Sample gallery photo 12", caption: "Sample photo 12" },
  { src: "/education.jpg", alt: "Sample gallery photo 13", caption: "Sample photo 13" },
  { src: "/key%20factor/medical.jpg", alt: "Sample gallery photo 14", caption: "Sample photo 14" },
  { src: "/impact/impact.jpg", alt: "Sample gallery photo 15", caption: "Sample photo 15" },
];

// A video is a YouTube link, or your own file in public/gallery/ (mp4 or webm)
// with an optional poster image.
// TODO: replace these placeholders with the group's own videos.
export type GalleryVideo =
  | { kind: "youtube"; url: string; title: string; thumbnail?: string }
  | { kind: "file"; src: string; title: string; poster?: string };

export const galleryVideos: GalleryVideo[] = [
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/key%20factor/healthcare.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/impact/sustainablity.png" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/key%20factor/hydro.jpg" },
  // SAMPLE items added to test Show more; remove when real ones are published.
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 4: replace with a group video", thumbnail: "/education.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 5: replace with a group video", thumbnail: "/key%20factor/healthcare.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 6: replace with a group video", thumbnail: "/key%20factor/construction.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 7: replace with a group video", thumbnail: "/hospital.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 8: replace with a group video", thumbnail: "/construction.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Sample gallery video 9: replace with a group video", thumbnail: "/key%20factor/edu.jpg" },
];
