// js/app.js
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
