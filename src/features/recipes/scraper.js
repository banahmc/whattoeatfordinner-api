const got = require('got');
const jsdom = require('jsdom');
const puppeteer = require('puppeteer');

const { JSDOM } = jsdom;

const mainUrl = 'https://damndelicious.net/';
const pageUrl = 'https://damndelicious.net/page/';

const getTotalPagesCount = async() => {
  const response = await got(mainUrl, {
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate',
      Host: 'damndelicious.net',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    },
  });
  const dom = new JSDOM(response.body);
  const lastPageNumberElement = dom.window.document.querySelector('.navigation .nav-links a:nth-child(7)');
  let lastPageNumber = 0;
  if (lastPageNumberElement) {
    lastPageNumber = parseInt(lastPageNumberElement.textContent, 10);
  }
  return lastPageNumber;
};

const getRecipesOnPage = async(browser, url) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'font' || request.resourceType() === 'image' || request.resourceType() === 'stylesheet') {
      request.abort();
    } else {
      request.continue();
    }
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const recipesOnPage = await page.evaluate(() => {
    const recipePosts = document.querySelectorAll('#content article.post');
    let recipes = [];
    for (let i = 0; i < recipePosts.length; i++) {
      const recipePost = recipePosts[i];

      // post base info
      const recipePostElement = recipePost.querySelectorAll('a')[0];
      if (recipePostElement) {
        let newRecipe = {
          title: recipePostElement.title,
          url: recipePostElement.href,
        };

        // post image
        const recipePostImageElement = recipePostElement.querySelectorAll('img');
        if (recipePostImageElement && recipePostImageElement.length > 0) {
          newRecipe = { ...newRecipe, imageUrl: recipePostImageElement[0].src };
        }

        // post date
        const recipePostDateElement = recipePostElement.querySelectorAll('.post-meta');
        if (recipePostDateElement && recipePostDateElement.length > 0) {
          const postDate = recipePostDateElement[0].textContent;
          if (postDate) {
            newRecipe = { ...newRecipe, dateAdded: new Date(Date.parse(postDate.trim())).toLocaleDateString('en-US') };
          }
        }
        recipes = [...recipes, newRecipe];
      }
    }
    return recipes;
  });
  return { url, count: recipesOnPage.length, recipes: recipesOnPage };
};

const getRecipes = async(fromPage = 1, toPage = undefined) => {
  let browser = null;
  let pageUrls = [];
  try {
    browser = await puppeteer.launch({
      args: ['--disable-features=site-per-process'],
      headless: true,
      devtools: false,
      defaultViewport: { width: 1200, height: 1000 },
    });

    const from = fromPage;
    let to = toPage;
    if (typeof to === 'undefined') {
      to = await getTotalPagesCount();
    }

    let tasks = [];
    for (let i = from; i <= to; i++) {
      const fullPageUrl = `${pageUrl}${i}`;
      pageUrls = [...pageUrls, fullPageUrl];
      tasks = [...tasks, getRecipesOnPage(browser, fullPageUrl)];
    }
    const recipes = await Promise.all(tasks);
    return { totalCount: recipes.reduce((a, b) => a + b.recipesCount, 0), recipes };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  getRecipes,
};
