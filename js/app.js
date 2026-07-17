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
