/**
 * Audio Helper Functions
 * Task 6.9: Download audio file functionality
 */

/**
 * Download an audio file from a URL
 * @param url - The URL of the audio file to download
 * @param filename - The name to save the file as
 */
export async function downloadAudioFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the audio file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create a temporary anchor element
    const link = document.createElement('a');
    const blobUrl = URL.createObjectURL(blob);

    // Set the download attributes
    link.href = blobUrl;
    link.download = filename;

    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading audio file:', error);
    throw error;
  }
}

/**
 * Generate a safe filename from a song title
 * @param title - The song title
 * @returns A safe filename with -liefdesliedje.mp3 suffix
 */
export function generateSongFilename(title: string): string {
  // Remove special characters and replace spaces with hyphens
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${safeName}-liefdesliedje.mp3`;
}
