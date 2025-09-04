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

    // Find the latest prediction file by its fixed name
    const latestPrediction = blobs.find(blob => blob.pathname === 'prediction_latest.json');

    if (!latestPrediction) {
        return response.status(404).json({ error: 'prediction_latest.json not found.' });
    }

    return response.status(200).json({ url: latestPrediction.url });
  } catch (error) {
    console.error('Error fetching latest prediction URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: 'Failed to get latest prediction URL.', details: errorMessage });
  }
}
