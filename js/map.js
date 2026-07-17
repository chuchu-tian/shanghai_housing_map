// js/map.js
import { SHANGHAI_CENTER, DEFAULT_ZOOM, RING_COLORS } from "./config.js";
let map;
let blockLayer;

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

export function getBlockLayer(){ return blockLayer; }
export function getMap(){ return map; }
