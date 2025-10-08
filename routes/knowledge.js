const express = require('express');
const mockDataService = require('../services/mockDataService');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all knowledge base articles
router.get('/', (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    
    const allArticles = mockDataService.getAllKnowledgeArticles(filters);
    const total = allArticles.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const articles = allArticles.slice(startIndex, endIndex);

    // Populate author data
    const populatedArticles = articles.map(article => {
      const author = mockDataService.findUserById(article.author);
      return {
        ...article,
        author: author ? {
          _id: author._id,
          name: author.name
        } : null
      };
    });

    res.json({
      articles: populatedArticles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get article by ID
router.get('/:id', (req, res) => {
  try {
    const article = mockDataService.findKnowledgeArticleById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Populate author data
    const author = mockDataService.findUserById(article.author);
    const populatedArticle = {
      ...article,
      author: author ? {
        _id: author._id,
        name: author.name
      } : null
    };

    res.json(populatedArticle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new article
router.post('/', (req, res) => {
  try {
    const { title, content, category, tags, author } = req.body;
    
    const newArticle = mockDataService.createKnowledgeArticle({
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      author: author || 'user_1' // Default to admin user
    });

    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update article
router.put('/:id', (req, res) => {
  try {
    const { title, content, category, tags, isPublished } = req.body;
    
    const updatedArticle = mockDataService.updateKnowledgeArticle(req.params.id, {
      title,
      content,
      category,
      tags,
      isPublished
    });

    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete article
router.delete('/:id', (req, res) => {
  try {
    const article = mockDataService.findKnowledgeArticleById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Mock deletion (in real app, you'd remove from array)
    const updatedArticle = mockDataService.updateKnowledgeArticle(req.params.id, {
      isPublished: false,
      deletedAt: new Date()
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search articles with AI
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Use AI service for intelligent search
    const aiSuggestions = await aiService.searchKnowledgeBase(query);
    
    // Also do regular search
    const regularResults = mockDataService.getAllKnowledgeArticles({ search: query });
    
    res.json({
      query,
      aiSuggestions,
      regularResults,
      totalResults: regularResults.length + aiSuggestions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate article helpfulness
router.post('/:id/rate', (req, res) => {
  try {
    const { helpful } = req.body;
    
    const article = mockDataService.findKnowledgeArticleById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Update rating
    if (helpful === true) {
      article.helpfulCount = (article.helpfulCount || 0) + 1;
    } else if (helpful === false) {
      article.notHelpfulCount = (article.notHelpfulCount || 0) + 1;
    }

    const updatedArticle = mockDataService.updateKnowledgeArticle(req.params.id, {
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount
    });

    res.json({
      message: 'Rating recorded successfully',
      article: updatedArticle
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get article categories
router.get('/categories/list', (req, res) => {
  try {
    const articles = mockDataService.getAllKnowledgeArticles();
    const categories = [...new Set(articles.map(article => article.category))];
    
    const categoryStats = categories.map(category => {
      const articlesInCategory = articles.filter(article => article.category === category);
      return {
        name: category,
        count: articlesInCategory.length,
        helpfulCount: articlesInCategory.reduce((sum, article) => sum + (article.helpfulCount || 0), 0)
      };
    });

    res.json({
      categories: categoryStats,
      totalCategories: categories.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get popular articles
router.get('/popular/list', (req, res) => {
  try {
    const articles = mockDataService.getAllKnowledgeArticles()
      .filter(article => article.isPublished)
      .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))
      .slice(0, 10);

    res.json({
      popularArticles: articles,
      count: articles.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;