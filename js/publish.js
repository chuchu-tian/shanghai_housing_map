// js/publish.js
import { isPublished, togglePublish, setPublished, activeProfile } from "./favorites.js";

// blockNames: 所有板块名数组
export function initPublishManager(blockNames){
  const modal = document.getElementById("publishModal");
  const list = document.getElementById("publishList");
  const open = async () => {
    // 打开时默认预勾“当前身份收藏的板块”（B 方案）
    const favBlocks = activeProfile().blocks.filter(n=>blockNames.includes(n));
    await setPublished(favBlocks);
    renderList();
    modal.classList.remove("modal-hidden");
  };
  const close = () => modal.classList.add("modal-hidden");

  function renderList(){
    list.innerHTML = blockNames.map(n=>`
      <li><label><input type="checkbox" data-pub="${n}" ${isPublished(n)?"checked":""}> ${n}</label></li>
    `).join("");
    list.querySelectorAll("[data-pub]").forEach(cb=>
      cb.onchange = async()=>{ await togglePublish(cb.dataset.pub); });
  }

  document.getElementById("publishBtn").onclick = open;
  document.getElementById("publishClose").onclick = close;
  modal.onclick = (e)=>{ if(e.target===modal) close(); };  // 点遮罩关闭

  // 复制“家人查看”链接（?view=published）
  document.getElementById("pubShareLink").onclick = async()=>{
    const link = `${location.origin}${location.pathname}?view=published`;
    try{ await navigator.clipboard.writeText(link); alert("已复制家人查看链接：\n"+link); }
    catch(_){ prompt("复制这个链接发给家人：", link); }
  };

  document.getElementById("pubSelectAll").onclick = async()=>{
    for(const n of blockNames){ if(!isPublished(n)) await togglePublish(n); }
    renderList();
  };
  document.getElementById("pubClearAll").onclick = async()=>{
    for(const n of blockNames){ if(isPublished(n)) await togglePublish(n); }
    renderList();
  };
  // “勾选所有收藏” = 发布列表精确设为当前身份收藏的板块（收藏的勾上、其余取消）
  document.getElementById("pubFromFav").onclick = async()=>{
    const favBlocks = activeProfile().blocks.filter(n=>blockNames.includes(n));
    await setPublished(favBlocks);
    renderList();
  };
}
