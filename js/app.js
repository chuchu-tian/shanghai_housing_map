// js/app.js
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
