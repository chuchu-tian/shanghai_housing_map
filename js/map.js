// js/map.js
import { SHANGHAI_CENTER, DEFAULT_ZOOM, RING_COLORS } from "./config.js";
let map;
let blockLayer;

export function initMap(){
  map = L.map("map", { zoomControl:true, attributionControl:false })
        .setView(SHANGHAI_CENTER, DEFAULT_ZOOM);
  updateGlowScale();
  map.on("zoomend", updateGlowScale);
  return map;
}

// 光晕范围随缩放联动：地图放大(zoom大)光晕大，缩小则小
function updateGlowScale(){
  const z = map.getZoom();
  // zoom 9→约2px，13→约10px，线性映射，夹在 [1.5, 12]
  const px = Math.max(1.5, Math.min(12, (z - 8) * 2));
  const el = document.getElementById("map");
  if(el) el.style.setProperty("--glow", px.toFixed(1) + "px");
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

export function renderRings(geo){
  L.geoJSON(geo, {
    style: f => ({
      color: RING_COLORS[f.properties.ring],
      weight: f.properties.ring==="in" ? 3 : f.properties.ring==="mid" ? 2.5 : 2,
      opacity: f.properties.ring==="in" ? 1 : f.properties.ring==="mid" ? 0.8 : 0.9,
      dashArray: "6 6", fill:false,
    }),
  }).addTo(map);
}

const BLOCK_NORMAL = { color:"#b2ecd0", weight:2.5, fillColor:"#ffffff", fillOpacity:0.9 };
const BLOCK_DISABLED = { color:"#d0d3cf", weight:2, fillColor:"#e9ebe8", fillOpacity:0.7 };
const BLOCK_SELECTED = { color:"#ffd43b", weight:3, fillColor:"#ffd43b", fillOpacity:0.95 };
const BLOCK_DIM = { color:"#d0d3cf", weight:1.5, fillColor:"#eef0ed", fillOpacity:0.45 };
// 收藏板块：浅黄边框 + 极淡黄填充，区分而不刺眼
const BLOCK_FAV = { color:"#ffd43b", weight:2.5, fillColor:"#fffbea", fillOpacity:0.95 };
let selectedLayer = null;

function styleFor(layer){
  if(layer === selectedLayer) return BLOCK_SELECTED;
  if(layer._disabled) return BLOCK_DISABLED;
  if(layer._fav) return BLOCK_FAV;
  return BLOCK_NORMAL;
}

export function renderBlocks(geo, onClick, onDeselect){
  blockLayer = L.geoJSON(geo, {
    style: BLOCK_NORMAL,
    onEachFeature: (f, layer) => {
      layer.bindTooltip(f.properties.name, { permanent:true, direction:"center", className:"block-label" });
      layer.on("mouseover", () => {
        if(layer._disabled) return;
        const el = layer.getElement();
        if(el) el.classList.add("block-hover-glow");   // 聚光光晕
        if(layer!==selectedLayer) layer.setStyle({ fillColor:"#ffe985", color:"#ffd43b", weight:3 });
      });
      layer.on("mouseout",  () => {
        const el = layer.getElement();
        if(el) el.classList.remove("block-hover-glow");
        if(!layer._disabled && layer!==selectedLayer) layer.setStyle(styleFor(layer));
      });
      layer.on("click", () => {
        if(layer._disabled) return;
        if(layer===selectedLayer){        // 再次点击已选中 → 取消选择
          deselectBlock();
          onDeselect && onDeselect();
        }else{
          selectBlock(layer);
          onClick(f.properties.name);
        }
      });
    },
  }).addTo(map);
  return blockLayer;
}

export function selectBlock(layer){
  const prev = selectedLayer;
  selectedLayer = layer;
  if(prev && prev!==layer) prev.setStyle(styleFor(prev));  // 恢复上一个选中
  layer.setStyle(BLOCK_SELECTED);
}

export function deselectBlock(){
  const prev = selectedLayer;
  selectedLayer = null;
  if(prev) prev.setStyle(styleFor(prev));
}

// 标记收藏板块（浅黄边框），并支持“只看收藏”淡化非收藏
export function markFavBlocks(favBlocks, favOnly){
  if(!blockLayer) return;
  blockLayer.eachLayer(layer=>{
    const name = layer.feature.properties.name;
    layer._fav = favBlocks.includes(name);
    const el = layer.getElement();
    if(favOnly){
      layer._disabled = !layer._fav;
      layer.setStyle(layer._fav ? styleFor(layer) : BLOCK_DIM);
      if(el) el.style.cursor = layer._fav ? "pointer" : "default";
    }else{
      layer._disabled = false;
      layer.setStyle(styleFor(layer));
      if(el) el.style.cursor = "pointer";
    }
  });
}

export function getBlockLayer(){ return blockLayer; }
export function getMap(){ return map; }

// 发布视图：只显示已发布板块（用于分享给家人的链接 ?view=published）。
// published 为空则不过滤（显示全部）。返回是否启用了过滤。
export function applyPublishView(publishedList){
  if(!blockLayer) return false;
  if(!publishedList || !publishedList.length) return false;
  blockLayer.eachLayer(layer=>{
    const name = layer.feature.properties.name;
    const shown = publishedList.includes(name);
    layer._disabled = !shown;
    const el = layer.getElement();
    if(shown){ layer.setStyle(styleFor(layer)); if(el) el.style.cursor="pointer"; }
    else{ layer.setStyle(BLOCK_DIM); if(el) el.style.cursor="default"; }
  });
  return true;
}

export function applyBlockFilter(housing, filter){
  if(!blockLayer) return;
  blockLayer.eachLayer(layer=>{
    const name = layer.feature.properties.name;
    const data = housing.blocks[name];
    const has = filter==="all" || (data && data.communities && data.communities.some(c=>c.property_type===filter));
    layer._disabled = !has;
    // 若当前选中的板块被筛选禁用，取消其选中态
    if(!has && layer===selectedLayer) selectedLayer = null;
    layer.setStyle(styleFor(layer));
    if(layer.getElement()) layer.getElement().style.cursor = has ? "pointer" : "default";
  });
}
