import { list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const { blobs } = await list();

    if (!blobs || blobs.length === 0) {
      return response.status(404).json({ error: 'No prediction files found.' });
    }

    // Sort blobs by uploaded date in descending order to find the latest one
    const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    const latestPrediction = sortedBlobs.find(blob => blob.pathname.startsWith('predictions_'));

    if (!latestPrediction) {
        return response.status(404).json({ error: 'No prediction files with the correct prefix found.' });
    }

    return response.status(200).json({ url: latestPrediction.url });
  } catch (error) {
    console.error('Error fetching latest prediction URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: 'Failed to get latest prediction URL.', details: errorMessage });
  }
}
