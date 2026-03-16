import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// The youtube client needs the auth to be set on it.
const youtubeClient = google.youtube({
  version: "v3",
  auth: oauth2Client,
});


export const YoutubeService = {
    client: youtubeClient,
    oauth2Client: oauth2Client,
};
