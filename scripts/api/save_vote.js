import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

export default async function handler(req, res) {
  // Set proper headers first
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  await limiter(req, res);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate content type
    if (!req.headers['content-type']?.includes('application/json')) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }

    const { itemId, rating } = req.body;
    
    if (!itemId || rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        required: { itemId: 'string', rating: 'number (1-5)' }
      });
    }

    const filePath = path.join(process.cwd(), '../../data/portfolio.json');
    const portfolio = JSON.parse(readFileSync(filePath, 'utf8'));

    const itemIndex = portfolio.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = portfolio[itemIndex];
    item.votes = item.votes || { average: 0, count: 0 };

    const { average, count } = item.votes;
    const newCount = count + 1;
    const newAverage = (average * count + rating) / newCount;

    portfolio[itemIndex] = {
      ...item,
      votes: {
        average: parseFloat(newAverage.toFixed(1)),
        count: newCount
      }
    };
    

    writeFileSync(filePath, JSON.stringify(portfolio, null, 2));

    return res.status(200).json({
      success: true,
      newAverage,
      newCount
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}