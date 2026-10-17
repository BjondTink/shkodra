import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

import { fetchAlbanianRssNews, RSS_SOURCES } from "./src/lib/rssService.ts";
import { getTickerData, fetchAlbanianWeather } from "./src/lib/weatherService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Use JSON middleware
  app.use(express.json());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Ticker Data (Weather & Rates) endpoint
  app.get("/api/ticker-data", async (req, res) => {
    try {
      const data = await getTickerData();
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.json({
        success: false,
        weather: [
          { name: "Tiranë", temp: 16, code: 0, condition: "Kthjellët" },
          { name: "Shkodër", temp: 15, code: 1, condition: "Kthjellët" },
          { name: "Durrës", temp: 17, code: 0, condition: "Kthjellët" }
        ],
        rates: [
          "EUR/LEK: 100.25",
          "USD/LEK: 92.40",
          "CHF/LEK: 104.20",
          "GBP/LEK: 118.50",
          "Kursi Zyrtar (LEK)"
        ],
        lastUpdated: new Date().toISOString()
      });
    }
  });

  // Tirana Weather endpoint for clock widget
  app.get("/api/weather/tirana", async (req, res) => {
    try {
      const weatherList = await fetchAlbanianWeather();
      const tirana = weatherList.find(w => w.name === "Tiranë") || weatherList[0] || {
        name: "Tiranë",
        temp: 16,
        code: 0,
        condition: "Kthjellët"
      };
      res.json({ success: true, ...tirana });
    } catch (err: any) {
      res.json({
        success: false,
        name: "Tiranë",
        temp: 16,
        code: 0,
        condition: "Kthjellët"
      });
    }
  });

  // Albanian RSS News API endpoint
  app.get("/api/rss-news", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const items = await fetchAlbanianRssNews(forceRefresh);
      res.json({
        success: true,
        count: items.length,
        lastUpdated: new Date().toISOString(),
        items
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, items: [] });
    }
  });

  // Albanian RSS News Sources endpoint
  app.get("/api/rss-news/sources", (req, res) => {
    res.json({ success: true, sources: RSS_SOURCES });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicit fallback for SPA in dev mode if vite.middlewares doesn't catch it
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const template = await vite.transformIndexHtml(url, 'index.html');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
