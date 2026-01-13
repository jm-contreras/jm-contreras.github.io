#!/usr/bin/env node

/**
 * Fetches Medium RSS feed and updates writing.json with essays and creative posts
 * Filters by "essay" and "creative" tags from Medium categories
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const MEDIUM_FEED_URL = 'https://medium.com/feed/@juanmaphd';
const OUTPUT_FILE = path.join(__dirname, '../content/writing.json');

async function fetchFeed() {
  return new Promise((resolve, reject) => {
    https.get(MEDIUM_FEED_URL, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function parseFeed(xmlData) {
  const parser = new xml2js.Parser();
  return parser.parseStringPromise(xmlData);
}

function extractPosts(parsedFeed) {
  const items = parsedFeed.rss.channel[0].item || [];
  const essays = [];
  const creative = [];

  items.forEach(item => {
    // Get categories (Medium tags)
    const categories = item.category || [];
    const tags = categories.map(c => {
      if (Array.isArray(c)) return c[0];
      if (typeof c === 'object' && c._) return c._;
      return String(c);
    });

    const hasEssayTag = tags.some(tag => tag.toLowerCase() === 'essay');
    const hasCreativeTag = tags.some(tag => tag.toLowerCase() === 'creative');

    if (!hasEssayTag && !hasCreativeTag) return;

    // Extract image from description HTML
    let imageUrl = '';
    const description = item.description?.[0] || '';
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }

    // Clean up excerpt: remove HTML, remove Medium link text, truncate
    let excerpt = description.replace(/<[^>]*>/g, '');
    excerpt = excerpt.replace(/Continue reading on Medium[^]*$/, '').trim();
    excerpt = excerpt.substring(0, 150) || '';

    const post = {
      title: item.title?.[0] || 'Untitled',
      url: item.link?.[0] || '',
      date: item.pubDate?.[0] ? new Date(item.pubDate[0]).toISOString().split('T')[0] : '',
      tags: hasEssayTag ? ['Essay'] : hasCreativeTag ? ['Creative'] : [],
      excerpt: excerpt,
      ...(imageUrl && { image: imageUrl })
    };

    if (hasEssayTag) {
      essays.push(post);
    }
    if (hasCreativeTag) {
      creative.push(post);
    }
  });

  return { essays, creative };
}

async function updateWritingJson(essays, creative) {
  const allPosts = [...essays, ...creative];
  
  // Sort by date (newest first)
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    medium_posts: allPosts,
    last_updated: new Date().toISOString()
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✅ Updated ${OUTPUT_FILE}`);
  console.log(`   - ${essays.length} essays`);
  console.log(`   - ${creative.length} creative posts`);
}

async function main() {
  try {
    console.log('📖 Fetching Medium RSS feed...');
    const xmlData = await fetchFeed();
    
    console.log('📝 Parsing feed...');
    const parsedFeed = await parseFeed(xmlData);
    
    console.log('🏷️  Filtering by tags...');
    const { essays, creative } = extractPosts(parsedFeed);
    
    console.log('💾 Updating writing.json...');
    await updateWritingJson(essays, creative);
    
    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
