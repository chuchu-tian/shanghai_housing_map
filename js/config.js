// js/config.js
export const CDN = {
  leafletCss: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  leafletJs:  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
};
export const SHANGHAI_CENTER = [31.22, 121.47];
export const DEFAULT_ZOOM = 11;
// 三环珊瑚红：内深→外浅
export const RING_COLORS = { in: "#e8590c", mid: "#ff922b", out: "#ffd8a8" };
// 类型色
export const TYPE_COLORS = { resale: "#12b886", new: "#ff922b" };
// 板块 → 所属环线（第一阶段 4 个板块）
export const BLOCK_RING = { "长征": "out", "苏河湾": "in", "古北": "mid", "中山公园": "mid" };
export const DATA = {
  districts: "data/geo/districts.geojson",
  blocks:    "data/geo/blocks.geojson",
  rings:     "data/geo/rings.geojson",
  housing:   "data/housing.json",
  profiles:  "data/profiles.json",
};
