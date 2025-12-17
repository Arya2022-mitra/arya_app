import fetch from "node-fetch";

export default async function handler(req, res) {
  const { q } = req.query;
  try {
    const geoRes = await fetch(
      `${process.env.GEO_API_URL}/api/citylist?q=${encodeURIComponent(q)}&apikey=${process.env.GEO_API_KEY}`
    );
    const data = await geoRes.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("GeoAPI error:", err);
    res.status(500).json({ error: "GeoAPI lookup failed" });
  }
}
