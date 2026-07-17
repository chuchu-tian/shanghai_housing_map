# 第一阶段实现计划 · 上海买房地图（本地完整版）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Mac 本地做出一个完整可交互的"清新果汁"风格上海买房地图——显示全部行政区 + 4 个手工板块（长征/苏河湾/古北/中山公园）+ 三环，支持悬停高亮、点击看面板、新房/二手筛选、收藏与多人档案，数据先手动录入。

**Architecture:** 纯前端（Leaflet + 原生 JS/CSS）+ Python 标准库本地服务（发页面 + 写 profiles.json）。数据分三类文件：地理边界 GeoJSON（行政区来自 DataV，板块/环线手工制作）、房产数据 housing.json（手动录入）、收藏档案 profiles.json（服务端读写）。第一阶段不做抓取、不做云。

**Tech Stack:** Leaflet 1.9（CDN）、Python3 http.server 扩展、Baloo 2 字体、原生 ES modules。

**执行方式：** 逐任务执行，每完成一个可见里程碑向用户汇报目标+结果，确认后继续。

---

## 文件结构（第一阶段）

```
shanghai-map/
├── index.html              # 页面骨架，引入 Leaflet、字体、各 JS 模块
├── css/style.css           # 清新果汁风格全部样式
├── js/
│   ├── config.js           # 常量：环线颜色、类型色、CDN、板块↔环线映射
│   ├── data.js             # 加载 geo/housing/profiles，做板块名↔数据关联
│   ├── map.js              # Leaflet 地图：底图关闭、渲染行政区/环线/板块、悬停高亮
│   ├── panel.js            # 右侧面板：板块总结、小区列表、类型标签、房龄换算
│   ├── filter.js           # 新房/二手筛选，地图与列表联动
│   ├── favorites.js        # 收藏（点星）、多档案身份切换/改名、只看收藏
│   └── app.js              # 入口：编排以上模块，绑定事件
├── server.py               # 本地服务：GET 静态文件 + POST /api/profiles 写档案
├── start.command           # 双击启动（起 server + 开浏览器）
├── data/
│   ├── geo/
│   │   ├── districts.geojson   # 行政区（DataV 下载）
│   │   ├── blocks.geojson      # 4 个板块（手工描点）
│   │   └── rings.geojson       # 内/中/外环（手工画大致椭圆线）
│   ├── housing.json            # 手动录入的板块房产数据
│   └── profiles.json           # 多人收藏档案
└── docs/                       # 已有 spec/design
```

---

## Task 1: 项目骨架 + 行政区底图

**Files:**
- Create: `index.html`, `css/style.css`, `js/config.js`, `js/data.js`, `js/map.js`, `js/app.js`
- Create: `data/geo/districts.geojson`（下载）

- [ ] **Step 1: 下载上海行政区 GeoJSON**

Run:
```bash
mkdir -p ~/Documents/Project/shanghai-map/data/geo ~/Documents/Project/shanghai-map/css ~/Documents/Project/shanghai-map/js
curl -sS -o ~/Documents/Project/shanghai-map/data/geo/districts.geojson \
  "https://geo.datav.aliyun.com/areas_v3/bound/310000_full.json"
```
Expected: 文件约 80KB，含 16 个区 feature。

- [ ] **Step 2: 验证下载内容**

Run:
```bash
grep -o '"name":"[^"]*区"' ~/Documents/Project/shanghai-map/data/geo/districts.geojson | wc -l
```
Expected: 输出 `16`。

- [ ] **Step 3: 写 config.js（常量）**

```javascript
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
```

- [ ] **Step 4: 写 index.html 骨架**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>上海买房地图</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Noto+Sans+SC:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <div id="map"></div>
    <aside id="panel" class="empty">
      <div class="panel-placeholder">点击地图上的板块查看详情</div>
    </aside>
  </div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: 写 css/style.css（基础布局 + 果汁底色）**

```css
*{box-sizing:border-box;margin:0;padding:0}
html,body,#app{height:100%}
body{font-family:"Baloo 2","Noto Sans SC",sans-serif}
#app{display:grid;grid-template-columns:1fr 380px}
#map{height:100%;background:linear-gradient(150deg,#fbfefc,#f2fbf6)}
.leaflet-container{background:linear-gradient(150deg,#fbfefc,#f2fbf6)}
#panel{padding:32px 26px;overflow-y:auto;background:#fff;color:#20323a;border-left:1px solid #eef1f3}
.panel-placeholder{color:#a9d9c3;font-size:14px;font-weight:600;margin-top:40px;text-align:center}
/* 行政区样式 */
.district-label{background:none;border:none;box-shadow:none;color:#a9d9c3;font-weight:700;font-size:13px}
```

- [ ] **Step 6: 写 data.js（加载器，先只加载行政区）**

```javascript
// js/data.js
import { DATA } from "./config.js";
export async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`加载失败 ${path}: ${r.status}`);
  return r.json();
}
export async function loadDistricts(){ return loadJSON(DATA.districts); }
```

- [ ] **Step 7: 写 map.js（初始化地图 + 画行政区，无底图）**

```javascript
// js/map.js
import { SHANGHAI_CENTER, DEFAULT_ZOOM } from "./config.js";
let map;
export function initMap(){
  map = L.map("map", { zoomControl:true, attributionControl:false })
        .setView(SHANGHAI_CENTER, DEFAULT_ZOOM);
  return map;
}
export function renderDistricts(geo){
  L.geoJSON(geo, {
    style: { color:"#c2beb2", weight:1.5, fill:true, fillColor:"#ffffff", fillOpacity:0.25 },
  }).addTo(map);
  geo.features.forEach(f=>{
    const c = f.properties.center || f.properties.centroid;
    if(c){
      L.marker([c[1], c[0]], {
        icon: L.divIcon({ className:"district-label", html:f.properties.name, iconSize:[60,16] }),
        interactive:false,
      }).addTo(map);
    }
  });
}
export function getMap(){ return map; }
```

- [ ] **Step 8: 写 app.js（入口，编排 Task1 部分）**

```javascript
// js/app.js
import { initMap, renderDistricts } from "./map.js";
import { loadDistricts } from "./data.js";
async function main(){
  initMap();
  try{
    const districts = await loadDistricts();
    renderDistricts(districts);
  }catch(e){ console.error(e); alert("行政区数据加载失败，请确认已用本地服务器打开（见 start.command）"); }
}
main();
```

- [ ] **Step 9: 起本地服务并人工验证**

Run:
```bash
cd ~/Documents/Project/shanghai-map && python3 -m http.server 8000
```
在浏览器打开 `http://localhost:8000`。
Expected: 看到上海 16 个区的边界（白色半透明填充、灰边），每个区中心有区名标签，底色是淡绿渐变，无第三方地图底图。

- [ ] **Step 10: 提交**

```bash
cd ~/Documents/Project/shanghai-map
git add index.html css/style.css js/config.js js/data.js js/map.js js/app.js data/geo/districts.geojson
git commit -m "feat(阶段1): 项目骨架 + 上海行政区底图（Leaflet，无底图，果汁底色）"
```

---

## Task 2: 手工制作 4 个板块 + 三环边界数据

**Files:**
- Create: `data/geo/blocks.geojson`, `data/geo/rings.geojson`

- [ ] **Step 1: 写 blocks.geojson（4 个板块的近似多边形）**

坐标为经纬度 [lng, lat]，是各板块大致范围的粗略四至矩形/多边形（第一阶段近似，后续可精修）。

```json
{
  "type": "FeatureCollection",
  "features": [
    { "type":"Feature", "properties":{"name":"苏河湾","district":"静安","ring":"in"},
      "geometry":{"type":"Polygon","coordinates":[[[121.455,31.250],[121.475,31.250],[121.475,31.262],[121.455,31.262],[121.455,31.250]]]} },
    { "type":"Feature", "properties":{"name":"古北","district":"长宁","ring":"mid"},
      "geometry":{"type":"Polygon","coordinates":[[[121.395,31.195],[121.415,31.195],[121.415,31.210],[121.395,31.210],[121.395,31.195]]]} },
    { "type":"Feature", "properties":{"name":"中山公园","district":"长宁","ring":"mid"},
      "geometry":{"type":"Polygon","coordinates":[[[121.410,31.218],[121.430,31.218],[121.430,31.232],[121.410,31.232],[121.410,31.218]]]} },
    { "type":"Feature", "properties":{"name":"长征","district":"普陀","ring":"out"},
      "geometry":{"type":"Polygon","coordinates":[[[121.360,31.235],[121.385,31.235],[121.385,31.255],[121.360,31.255],[121.360,31.235]]]} }
  ]
}
```

- [ ] **Step 2: 写 rings.geojson（内/中/外环大致椭圆线）**

用多点近似椭圆的 LineString（第一阶段大致位置；坐标围绕人民广场约 [121.475,31.23]）。

```json
{
  "type": "FeatureCollection",
  "features": [
    { "type":"Feature", "properties":{"ring":"in","name":"内环"},
      "geometry":{"type":"LineString","coordinates":[[121.475,31.265],[121.510,31.245],[121.510,31.215],[121.475,31.195],[121.440,31.215],[121.440,31.245],[121.475,31.265]]]} },
    { "type":"Feature", "properties":{"ring":"mid","name":"中环"},
      "geometry":{"type":"LineString","coordinates":[[121.475,31.300],[121.545,31.255],[121.545,31.205],[121.475,31.160],[121.405,31.205],[121.405,31.255],[121.475,31.300]]]} },
    { "type":"Feature", "properties":{"ring":"out","name":"外环"},
      "geometry":{"type":"LineString","coordinates":[[121.475,31.345],[121.585,31.265],[121.585,31.195],[121.475,31.120],[121.365,31.195],[121.365,31.265],[121.475,31.345]]]} }
  ]
}
```

- [ ] **Step 2b: 校验 JSON 合法**

Run:
```bash
python3 -c "import json;json.load(open('data/geo/blocks.geojson'));json.load(open('data/geo/rings.geojson'));print('JSON OK')"
```
Expected: `JSON OK`

- [ ] **Step 3: map.js 增加渲染环线 + 板块**

在 map.js 追加（RING_COLORS 需 import）:
```javascript
import { SHANGHAI_CENTER, DEFAULT_ZOOM, RING_COLORS } from "./config.js";

export function renderRings(geo){
  L.geoJSON(geo, {
    style: f => ({
      color: RING_COLORS[f.properties.ring], weight: f.properties.ring==="in"?3:f.properties.ring==="mid"?2.5:2,
      opacity: f.properties.ring==="in"?1:f.properties.ring==="mid"?0.8:0.9,
      dashArray: "6 6", fill:false,
    }),
  }).addTo(map);
}
let blockLayer;
export function renderBlocks(geo, onClick){
  blockLayer = L.geoJSON(geo, {
    style: { color:"#b2ecd0", weight:2.5, fillColor:"#ffffff", fillOpacity:0.9 },
    onEachFeature: (f, layer) => {
      layer.bindTooltip(f.properties.name, { permanent:true, direction:"center", className:"block-label" });
      layer.on("mouseover", () => layer.setStyle({ fillColor:"#ffd43b", color:"#ffd43b", weight:3 }));
      layer.on("mouseout",  () => blockLayer.resetStyle(layer));
      layer.on("click", () => onClick(f.properties.name));
    },
  }).addTo(map);
  return blockLayer;
}
```

- [ ] **Step 4: style.css 增加板块标签样式**

```css
.block-label{background:none;border:none;box-shadow:none;color:#0f9d6f;font-weight:700;font-size:13px}
```

- [ ] **Step 5: app.js 加载并渲染环线 + 板块**

```javascript
import { initMap, renderDistricts, renderRings, renderBlocks } from "./map.js";
import { loadJSON } from "./data.js";
import { DATA } from "./config.js";
async function main(){
  initMap();
  try{
    const [districts, rings, blocks] = await Promise.all([
      loadJSON(DATA.districts), loadJSON(DATA.rings), loadJSON(DATA.blocks),
    ]);
    renderDistricts(districts);
    renderRings(rings);
    renderBlocks(blocks, (name)=>console.log("clicked", name));
  }catch(e){ console.error(e); alert("数据加载失败，请用本地服务器打开"); }
}
main();
```

- [ ] **Step 6: 人工验证**

刷新 `http://localhost:8000`。
Expected: 在行政区之上看到 3 条珊瑚红椭圆环线（内深→外浅）+ 4 个白色板块块（带板块名）；鼠标移到板块上变柠檬黄并加粗；点击板块时浏览器控制台打印板块名。

- [ ] **Step 7: 提交**

```bash
git add data/geo/blocks.geojson data/geo/rings.geojson js/map.js js/app.js css/style.css
git commit -m "feat(阶段1): 4个板块 + 三环边界，板块悬停柠檬黄高亮"
```

---

## Task 3: 手动房产数据 + 点击出面板

**Files:**
- Create: `data/housing.json`, `js/panel.js`
- Modify: `js/app.js`, `css/style.css`

- [ ] **Step 1: 写 housing.json（4 板块示例数据，含新房/二手/房龄）**

（价格为占位示例，用户后续按实际填写。）
```json
{
  "updated_at": "2026-07-17",
  "blocks": {
    "古北": {
      "resale_avg_price": 85000, "new_avg_price": null,
      "pros": ["涉外成熟社区","配套齐全","黄金城道商业街"],
      "cons": ["房龄偏老","单价高","车位紧张"],
      "communities": [
        { "name":"古北中央花园","property_type":"resale","avg_price":91000,"last_deal":"2026-06","built_year":2004 },
        { "name":"黄金城道","property_type":"resale","avg_price":88000,"last_deal":"2026-05","built_year":2006 }
      ]
    },
    "苏河湾": {
      "resale_avg_price": 110000, "new_avg_price": 130000,
      "pros":["近市中心","滨河景观","新盘多"], "cons":["单价很高"],
      "communities":[
        { "name":"苏河湾中心","property_type":"new","list_price":132000,"built_year":2026 },
        { "name":"华侨城苏河湾","property_type":"resale","avg_price":108000,"last_deal":"2026-04","built_year":2018 }
      ]
    },
    "中山公园": {
      "resale_avg_price": 92000, "new_avg_price": null,
      "pros":["交通枢纽","商业成熟"], "cons":["老小区多"],
      "communities":[
        { "name":"兆丰花园","property_type":"resale","avg_price":95000,"last_deal":"2026-06","built_year":2001 }
      ]
    },
    "长征": {
      "resale_avg_price": 62000, "new_avg_price": 68000,
      "pros":["性价比高","有新盘"], "cons":["离市中心较远"],
      "communities":[
        { "name":"长征某新盘","property_type":"new","list_price":68000,"built_year":2027 },
        { "name":"长征某二手","property_type":"resale","avg_price":61000,"last_deal":"2026-05","built_year":2012 }
      ]
    }
  }
}
```

- [ ] **Step 2: data.js 增加加载 housing 并按板块名关联**

```javascript
export async function loadAll(){
  const { DATA } = await import("./config.js");
  const [districts, rings, blocks, housing] = await Promise.all([
    loadJSON(DATA.districts), loadJSON(DATA.rings), loadJSON(DATA.blocks), loadJSON(DATA.housing),
  ]);
  return { districts, rings, blocks, housing };
}
export function blockData(housing, name){ return housing.blocks[name] || null; }
```

- [ ] **Step 3: 写 panel.js（渲染板块面板）**

```javascript
// js/panel.js
const CUR_YEAR = 2026;
function ageText(c){
  if(!c.built_year) return "";
  if(c.built_year > CUR_YEAR) return `${c.built_year}交付`;
  return `房龄${CUR_YEAR - c.built_year}年`;
}
function priceText(c){
  if(c.property_type==="new") return c.list_price ? `${(c.list_price/10000).toFixed(1)}万` : "—";
  return c.avg_price ? `${(c.avg_price/10000).toFixed(1)}万` : "—";
}
function money(v){ return v ? `${(v/10000).toFixed(1)}万` : "—"; }

export function renderPanel(name, data){
  const panel = document.getElementById("panel");
  panel.classList.remove("empty");
  if(!data){ panel.innerHTML = `<div class="p-name">${name}</div><div class="p-sub">暂无数据</div>`; return; }
  const li = c => `<li data-type="${c.property_type}">
      <span>${c.name} <span class="badge ${c.property_type}">${c.property_type==="new"?"新房":"二手"}</span></span>
      <span class="rt">${priceText(c)}${ageText(c)?" · "+ageText(c):""}</span></li>`;
  panel.innerHTML = `
    <div class="p-block"><span class="p-name">${name}</span></div>
    <div class="p-sub">${(data.pros&&data.pros[0])||""}</div>
    <div class="price-row">
      <div class="price-box resale"><div class="lbl">二手成交均价</div><div class="val">${money(data.resale_avg_price)}</div></div>
      <div class="price-box new"><div class="lbl">新房均价</div><div class="val">${money(data.new_avg_price)}</div></div>
    </div>
    ${data.pros?`<div class="tags pros">优点：${data.pros.join(" · ")}</div>`:""}
    ${data.cons?`<div class="tags cons">缺点：${data.cons.join(" · ")}</div>`:""}
    <ul class="clist">${(data.communities||[]).map(li).join("")}</ul>`;
}
```

- [ ] **Step 4: style.css 增加面板样式（果汁风格）**

```css
.p-block{display:flex;align-items:baseline;gap:8px}
.p-name{font-size:28px;font-weight:800;color:#0f9d6f}
.p-sub{font-size:12px;margin-top:6px;font-weight:600;color:#7cc9a5}
.price-row{display:flex;gap:13px;margin-top:20px}
.price-box{flex:1;border-radius:16px;padding:15px;background:#eefaf3}
.price-box.new{background:#fff3e8}
.price-box .lbl{font-size:10px;font-weight:700;color:#6abf99}
.price-box.new .lbl{color:#f0851f}
.price-box .val{font-size:24px;font-weight:800;margin-top:5px;color:#0f9d6f}
.price-box.new .val{color:#e8590c}
.tags{margin-top:14px;font-size:12px;font-weight:600;line-height:1.6}
.tags.pros{color:#0f9d6f}.tags.cons{color:#e8863c}
.clist{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:20px}
.clist li{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:12px 14px;border-radius:14px;gap:10px;font-weight:600;background:#f4fbf7}
.clist li .rt{white-space:nowrap;font-size:12px;font-weight:600;opacity:.85}
.badge{font-size:10px;padding:3px 9px;border-radius:999px;font-weight:800}
.badge.resale{background:#12b886;color:#fff}.badge.new{background:#ff922b;color:#fff}
```

- [ ] **Step 5: app.js 接线（点击板块渲染面板）**

```javascript
import { initMap, renderDistricts, renderRings, renderBlocks } from "./map.js";
import { loadAll, blockData } from "./data.js";
import { renderPanel } from "./panel.js";
async function main(){
  initMap();
  try{
    const { districts, rings, blocks, housing } = await loadAll();
    renderDistricts(districts);
    renderRings(rings);
    renderBlocks(blocks, (name)=> renderPanel(name, blockData(housing, name)));
    window.__housing = housing; // 供后续筛选/收藏用
  }catch(e){ console.error(e); alert("数据加载失败，请用本地服务器打开"); }
}
main();
```

- [ ] **Step 6: 人工验证**

刷新页面，点击"古北"板块。
Expected: 右侧面板显示"古北"、二手均价 8.5万、新房均价"—"、优点/缺点、小区列表（古北中央花园/黄金城道，带"二手"标签和房龄）。点其他板块面板相应更新。

- [ ] **Step 7: 提交**

```bash
git add data/housing.json js/panel.js js/data.js js/app.js css/style.css
git commit -m "feat(阶段1): 手动房产数据 + 点击板块出详情面板（新房/二手/房龄）"
```

---

## Task 4: 新房/二手筛选联动

**Files:**
- Create: `js/filter.js`
- Modify: `index.html`, `js/app.js`, `css/style.css`, `js/map.js`

- [ ] **Step 1: index.html 增加筛选栏**

在 `<div id="map"></div>` 内之后、`</div>`(#app) 前不便加；改为在 body 内地图上浮层。修改 #map 容器为包裹：
```html
    <div id="map-wrap">
      <div id="map"></div>
      <div id="filterbar">
        <button data-filter="all" class="on">全部</button>
        <button data-filter="new">只看新房</button>
        <button data-filter="resale">只看二手</button>
      </div>
    </div>
```
并把 `#app` 的第一列改为 `#map-wrap`。

- [ ] **Step 2: css 调整（map-wrap 定位 + filterbar 样式）**

```css
#app{display:grid;grid-template-columns:1fr 380px}
#map-wrap{position:relative}
#map{height:100%}
#filterbar{position:absolute;bottom:20px;left:20px;z-index:500;display:flex;gap:8px}
#filterbar button{border:none;font-size:12px;padding:9px 16px;border-radius:999px;cursor:pointer;font-weight:700;background:#fff;color:#0f9d6f;box-shadow:0 3px 0 #cbeedd}
#filterbar button.on{background:#12b886;color:#fff;box-shadow:0 3px 0 #0c8f6b}
.clist li.hidden{display:none}
```

- [ ] **Step 3: 写 filter.js**

```javascript
// js/filter.js
let current = "all";
export function getFilter(){ return current; }
// 板块是否含某类型小区
export function blockHasType(data, type){
  if(!data || !data.communities) return false;
  if(type==="all") return true;
  return data.communities.some(c => c.property_type===type);
}
export function initFilter(onChange){
  document.querySelectorAll("#filterbar button").forEach(btn=>{
    btn.onclick = () => {
      document.querySelectorAll("#filterbar button").forEach(b=>b.classList.remove("on"));
      btn.classList.add("on");
      current = btn.dataset.filter;
      onChange(current);
    };
  });
}
```

- [ ] **Step 4: map.js 增加按筛选淡化板块的能力**

```javascript
export function applyBlockFilter(housing, filter){
  if(!blockLayer) return;
  blockLayer.eachLayer(layer=>{
    const name = layer.feature.properties.name;
    const data = housing.blocks[name];
    const has = filter==="all" || (data && data.communities && data.communities.some(c=>c.property_type===filter));
    layer.setStyle({ fillOpacity: has?0.9:0.15, opacity: has?1:0.3 });
  });
}
```

- [ ] **Step 5: panel.js 支持按筛选隐藏小区行**

在 renderPanel 末尾导出一个应用函数：
```javascript
export function filterPanelList(type){
  document.querySelectorAll(".clist li").forEach(li=>{
    li.classList.toggle("hidden", type!=="all" && li.dataset.type!==type);
  });
}
```

- [ ] **Step 6: app.js 接线筛选**

```javascript
import { initFilter } from "./filter.js";
import { renderPanel, filterPanelList } from "./panel.js";
import { applyBlockFilter } from "./map.js";
// main() 内，渲染后：
  initFilter((type)=>{ applyBlockFilter(housing, type); filterPanelList(type); });
```

- [ ] **Step 7: 人工验证**

刷新页面。点"只看新房"。
Expected: 地图上没有新房的板块（古北、中山公园）变淡/半透明，有新房的（苏河湾、长征）正常；已打开的面板里二手小区行隐藏、只剩新房行。点"全部"恢复。

- [ ] **Step 8: 提交**

```bash
git add index.html css/style.css js/filter.js js/map.js js/panel.js js/app.js
git commit -m "feat(阶段1): 新房/二手筛选，地图淡化与面板列表联动"
```

---

## Task 5: 本地服务 server.py + 收藏与多人档案

**Files:**
- Create: `server.py`, `js/favorites.js`, `data/profiles.json`
- Modify: `index.html`, `js/app.js`, `js/panel.js`, `css/style.css`

- [ ] **Step 1: 写 data/profiles.json（初始两个档案）**

```json
{
  "profiles": [
    { "id":"user1", "name":"我", "blocks":[], "communities":[] },
    { "id":"user2", "name":"闺蜜", "blocks":[], "communities":[] }
  ],
  "active": "user1"
}
```

- [ ] **Step 2: 写 server.py（静态服务 + 写档案 API，含原子写）**

```python
#!/usr/bin/env python3
import http.server, socketserver, json, os, tempfile
ROOT = os.path.dirname(os.path.abspath(__file__))
PROFILES = os.path.join(ROOT, "data", "profiles.json")
PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_POST(self):
        if self.path != "/api/profiles":
            self.send_error(404); return
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self.send_error(400, "bad json"); return
        # 原子写：先写临时文件再替换
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(PROFILES))
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp, PROFILES)
        self.send_response(200); self.send_header("Content-Type","application/json")
        self.end_headers(); self.wfile.write(b'{"ok":true}')

if __name__ == "__main__":
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"上海买房地图运行中：http://localhost:{PORT}")
        httpd.serve_forever()
```

- [ ] **Step 3: 写 favorites.js（档案状态 + 读写服务端）**

```javascript
// js/favorites.js
import { loadJSON } from "./data.js";
import { DATA } from "./config.js";
let state = null;
export async function loadProfiles(){ state = await loadJSON(DATA.profiles); return state; }
export function activeProfile(){ return state.profiles.find(p=>p.id===state.active); }
export function isFav(kind, name){ const p=activeProfile(); return (kind==="block"?p.blocks:p.communities).includes(name); }
export function toggleFav(kind, name){
  const p = activeProfile(); const arr = kind==="block"?p.blocks:p.communities;
  const i = arr.indexOf(name);
  if(i>=0) arr.splice(i,1); else arr.push(name);
  return save();
}
export function switchProfile(id){ state.active = id; return save(); }
export function renameProfile(id, name){ const p=state.profiles.find(x=>x.id===id); if(p)p.name=name; return save(); }
async function save(){
  await fetch("/api/profiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(state) });
}
export function getState(){ return state; }
```

- [ ] **Step 4: index.html 增加身份切换栏**

在 `#panel` 顶部前加一个顶栏：
```html
  <header id="topbar">
    <select id="profileSelect"></select>
    <button id="renameBtn" title="改名">✎</button>
    <label id="favOnly"><input type="checkbox"> 只看收藏</label>
  </header>
```
并把 `#app` 改为在其上方留出 topbar（用 grid-row 或把 topbar 放在 #panel 内顶部——第一阶段放 #panel 内顶部最简单）。实际：把 header 放进 `<aside id="panel">` 的最前面。

- [ ] **Step 5: css 顶栏 + 星标样式**

```css
#topbar{display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;font-weight:600}
#profileSelect{font-family:inherit;font-weight:700;color:#0f9d6f;border:2px solid #d6f0e2;border-radius:10px;padding:6px 10px;background:#f4fbf7}
#renameBtn{border:none;background:#eefaf3;color:#0f9d6f;border-radius:8px;padding:6px 9px;cursor:pointer;font-weight:700}
#favOnly{margin-left:auto;color:#7cc9a5;cursor:pointer}
.starbtn{cursor:pointer;color:#dfe6e2;font-size:16px;background:none;border:none}
.starbtn.on{color:#ff922b}
.clist li.fav{border-left:3px solid #ff922b}
```

- [ ] **Step 6: panel.js 增加小区/板块星标（点击调 toggleFav）**

在 renderPanel 内板块名旁加星、每个小区行加星，并在渲染后绑定：
```javascript
import { isFav, toggleFav } from "./favorites.js";
// p-block 改为： <span class="p-name">${name}</span>
//   <button class="starbtn ${isFav('block',name)?'on':''}" data-fav-block="${name}">★</button>
// 小区 li 改为在 name 前加：
//   <button class="starbtn ${isFav('community',c.name)?'on':''}" data-fav-comm="${c.name}">★</button>
//   并给 li 加 class fav（若已收藏）
export function bindStars(rerender){
  document.querySelectorAll("[data-fav-block]").forEach(b=> b.onclick = async()=>{ await toggleFav("block", b.dataset.favBlock); rerender(); });
  document.querySelectorAll("[data-fav-comm]").forEach(b=> b.onclick = async()=>{ await toggleFav("community", b.dataset.favComm); rerender(); });
}
```
（renderPanel 结束后调用 bindStars。）

- [ ] **Step 7: app.js 接线档案（下拉、改名、只看收藏、重渲染）**

```javascript
import { loadProfiles, getState, switchProfile, renameProfile, activeProfile } from "./favorites.js";
import { bindStars } from "./panel.js";
// main() 内先 await loadProfiles();
function refreshProfileUI(){
  const s = getState(); const sel = document.getElementById("profileSelect");
  sel.innerHTML = s.profiles.map(p=>`<option value="${p.id}" ${p.id===s.active?"selected":""}>${p.name}</option>`).join("");
}
// 绑定下拉切换、改名按钮、只看收藏 checkbox（略：调 switchProfile/renameProfile 后重渲染当前面板与地图收藏标记）
```
（完整事件绑定在实现时补齐：切换/改名后重渲染面板与星标；"只看收藏"过滤地图板块与列表。）

- [ ] **Step 8: 写 start.command（双击启动）**

```bash
#!/bin/bash
cd "$(dirname "$0")"
python3 server.py &
sleep 1
open "http://localhost:8000"
wait
```
Run: `chmod +x ~/Documents/Project/shanghai-map/start.command`

- [ ] **Step 9: 人工验证**

Run: `cd ~/Documents/Project/shanghai-map && python3 server.py`，浏览器开 localhost:8000。
Expected: 顶部有档案下拉（我/闺蜜）；点板块面板里的★收藏，刷新后仍在（写入 profiles.json）；切换到"闺蜜"收藏独立；改名生效；"只看收藏"只显示已收藏板块/小区。检查 `data/profiles.json` 内容随操作更新。

- [ ] **Step 10: 提交**

```bash
git add server.py js/favorites.js data/profiles.json start.command index.html js/app.js js/panel.js css/style.css
git commit -m "feat(阶段1): 本地服务 + 收藏/多人档案/只看收藏 + 双击启动"
```

---

## Task 6: 板块勾选（为第二阶段发布预留）+ 更新脚本占位 + 使用手册

**Files:**
- Create: `docs/USAGE.md`
- Modify: `js/favorites.js`/`panel.js`（勾选标记）, `data/profiles.json`（加 published 字段位）

- [ ] **Step 1: profiles.json 增加 published 板块清单占位**

```json
{ "profiles":[...], "active":"user1", "published": [] }
```

- [ ] **Step 2: 面板板块名旁加"发布"勾选框（写入 published）**

在 panel.js 板块标题区加一个 checkbox，勾选调用一个 togglePublish(name)（在 favorites.js 实现，写 state.published 并 save）。第一阶段仅记录，不真正推云。

- [ ] **Step 3: 写 docs/USAGE.md（使用手册，无代码）**

内容涵盖：如何启动（双击 start.command）、看地图、悬停/点击、新房二手筛选、收藏与取消（点★）、切换身份/改名、只看收藏、勾选发布（说明第二阶段生效）、数据如何手动更新（编辑 data/housing.json 的说明）、iCloud 同步（把项目放 iCloud Drive）。

- [ ] **Step 4: 人工验证**

刷新，勾选某板块"发布"，检查 profiles.json 的 published 数组更新。阅读 USAGE.md 无占位。

- [ ] **Step 5: 提交**

```bash
git add js/favorites.js js/panel.js data/profiles.json docs/USAGE.md
git commit -m "feat(阶段1): 板块发布勾选（记录）+ 使用手册 USAGE.md"
```

---

## 阶段一完成标准

- 打开 start.command → 浏览器显示上海行政区 + 4 板块 + 三环（清新果汁风格）
- 悬停板块柠檬黄高亮；点击出面板（二手/新房均价分开、优缺点、小区列表带类型标签与房龄）
- 新房/二手筛选，地图与列表联动
- 收藏（多人档案、切换、改名、只看收藏），刷新后保留
- 板块可勾选"发布"（为第二阶段预留）
- USAGE.md 使用手册

## 阶段一之后（下一步预告，不在本计划内）

- 精修/补充更多板块边界与真实数据
- 尝试可行的数据源自动抓取（作为增强，多源可插拔架构）
- 第二阶段：上云、响应式/PWA、后端数据库、发布精选到云、家人多设备实时收藏
