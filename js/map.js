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
