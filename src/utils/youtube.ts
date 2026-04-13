/**
 * YouTube URL parsing utilities
 * Handles various YouTube URL formats (standard, shorts, embed, youtu.be)
 */

/**
 * Extract the YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtu.be/VIDEO_ID
 *
 * @param url - YouTube URL or any string
 * @returns YouTube video ID or null if not found
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  const cleanUrl = url.trim();

  // Regular expressions for different YouTube URL formats
  const patterns = [
    // Standard YouTube URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    // YouTube Shorts: youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get the YouTube embed URL from a video ID or full URL
 * Returns a URL suitable for use in an iframe src attribute
 *
 * @param url - YouTube URL or video ID
 * @returns YouTube embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Check if a URL is a valid YouTube URL
 *
 * @param url - URL to check
 * @returns true if the URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
