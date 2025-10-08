const express = require('express');
const KnowledgeBase = require('../models/KnowledgeBase');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all knowledge base articles
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await KnowledgeBase.find(filter)
      .populate('author', 'name')
      .sort({ lastUpdated: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await KnowledgeBase.countDocuments(filter);

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('author', 'name');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new article
router.post('/', async (req, res) => {
  try {
    const { title, content, category, tags, keywords } = req.body;

    const article = new KnowledgeBase({
      title,
      content,
      category,
      tags: tags || [],
      keywords: keywords || [],
      author: req.user.userId
    });

    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update article
router.put('/:id', async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    Object.assign(article, req.body);
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete article
router.delete('/:id', async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search articles with AI-powered suggestions
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    // Basic text search
    const articles = await KnowledgeBase.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { keywords: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .populate('author', 'name')
    .sort({ viewCount: -1, lastUpdated: -1 })
    .limit(10);

    // AI-powered suggestions
    const aiSuggestions = await aiService.suggestKnowledgeBaseArticles(query, articles);

    res.json({
      articles,
      aiSuggestions,
      query
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate article helpfulness
router.post('/:id/rate', async (req, res) => {
  try {
    const { helpful } = req.body;
    const article = await KnowledgeBase.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (helpful) {
      article.helpfulCount += 1;
    } else {
      article.notHelpfulCount += 1;
    }

    await article.save();
    res.json({ message: 'Rating recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get FAQ articles
router.get('/category/faq', async (req, res) => {
  try {
    const faqs = await KnowledgeBase.find({
      category: 'faq',
      isPublished: true
    })
    .populate('author', 'name')
    .sort({ viewCount: -1 });

    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get popular articles
router.get('/popular', async (req, res) => {
  try {
    const popular = await KnowledgeBase.find({
      isPublished: true
    })
    .populate('author', 'name')
    .sort({ viewCount: -1, helpfulCount: -1 })
    .limit(10);

    res.json(popular);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
