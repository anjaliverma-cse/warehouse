const STORAGE_KEY = "wareflow_project_v1";

const starterData = {
  products: [
    {id:"SKU-1001",name:"Wireless Mouse",category:"Electronics",price:799,stock:42,reorder:10},
    {id:"SKU-1002",name:"Mechanical Keyboard",category:"Electronics",price:2499,stock:18,reorder:8},
    {id:"SKU-1003",name:"USB-C Hub",category:"Accessories",price:1299,stock:7,reorder:10},
    {id:"SKU-1004",name:"Laptop Stand",category:"Accessories",price:999,stock:26,reorder:8},
    {id:"SKU-1005",name:"Desk Lamp",category:"Home Office",price:1499,stock:4,reorder:8},
    {id:"SKU-1006",name:"Notebook Set",category:"Stationery",price:299,stock:65,reorder:15}
  ],
  orders: [
    {id:"WF-2401",customer:"Aanya Sharma",product:"Wireless Mouse",quantity:2,address:"Sector 22, Chandigarh",date:"2026-11-09",status:"Pending"},
    {id:"WF-2402",customer:"Rohan Mehta",product:"Mechanical Keyboard",quantity:1,address:"Model Town, Ludhiana",date:"2026-11-09",status:"Picking"},
    {id:"WF-2403",customer:"Ishita Kapoor",product:"USB-C Hub",quantity:2,address:"Civil Lines, Jaipur",date:"2026-11-08",status:"Packed"},
    {id:"WF-2404",customer:"Kabir Singh",product:"Laptop Stand",quantity:1,address:"Sector 17, Panchkula",date:"2026-11-08",status:"Dispatched"},
    {id:"WF-2405",customer:"Meera Joshi",product:"Notebook Set",quantity:3,address:"BRS Nagar, Ludhiana",date:"2026-11-07",status:"Delivered"}
  ]
};

let state = loadState();
let toastTimer;

function loadState(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(starterData);
  } catch(e) { return structuredClone(starterData); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function money(n){ return "₹" + Number(n).toLocaleString("en-IN"); }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function statusClass(s){ return s.toLowerCase(); }
function badge(s){ return `<span class="status ${statusClass(s)}">${s}</span>`; }
function showToast(message){
  const el=document.getElementById("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
}
function goTo(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const active=document.querySelector(`.nav-item[data-page="${page}"]`);
  document.getElementById("crumb").textContent=active?active.textContent.trim():page;
  document.getElementById("sidebar").classList.remove("open");
  renderAll();
}
function productByName(name){ return state.products.find(p=>p.name===name); }
function orderTotal(o){ const p=productByName(o.product); return (p?p.price:0)*o.quantity; }
function renderDashboard(){
  const orders=state.orders, total=orders.length;
  document.getElementById("statTotal").textContent=total;
  document.getElementById("statPending").textContent=orders.filter(o=>["Pending","Picking"].includes(o.status)).length;
  document.getElementById("statReady").textContent=orders.filter(o=>o.status==="Packed").length;
  document.getElementById("statCompleted").textContent=orders.filter(o=>o.status==="Delivered").length;
  document.getElementById("navOrderCount").textContent=orders.length;
  const recent=[...orders].slice(-5).reverse();
  document.getElementById("recentOrders").innerHTML=recent.length?recent.map(o=>`<tr><td class="order-id">${o.id}</td><td class="customer-cell">${esc(o.customer)}</td><td>${o.date}</td><td>${money(orderTotal(o))}</td><td>${badge(o.status)}</td></tr>`).join(""):`<tr><td colspan="5">No orders yet.</td></tr>`;
  const stages=[["Processing",orders.filter(o=>["Pending","Picking"].includes(o.status)).length,"processing"],["Packed",orders.filter(o=>o.status==="Packed").length,"packed"],["Dispatched",orders.filter(o=>["Dispatched","Delivered"].includes(o.status)).length,"dispatched"]];
  document.getElementById("pipeline").innerHTML=stages.map(([name,n,cls])=>`<div class="pipe-row"><span>${name}</span><div class="pipe-track"><div class="pipe-fill ${cls}" style="width:${total?Math.max(3,n/total*100):0}%"></div></div><b>${n}</b></div>`).join("");
}
function renderOrders(){
  const q=(document.getElementById("orderSearch")?.value||"").toLowerCase();
  const filter=document.getElementById("orderFilter")?.value||"all";
  const list=state.orders.filter(o=>(filter==="all"||o.status===filter)&&(`${o.id} ${o.customer}`.toLowerCase().includes(q))).slice().reverse();
  document.getElementById("ordersTable").innerHTML=list.length?list.map(o=>`<tr><td class="order-id">${o.id}</td><td class="customer-cell">${esc(o.customer)}</td><td>${o.quantity} × ${esc(o.product)}</td><td>${o.date}</td><td>${money(orderTotal(o))}</td><td>${badge(o.status)}</td><td><button class="action-btn" data-delete="${o.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="7">No matching orders found.</td></tr>`;
  document.getElementById("orderCount").textContent=`Showing ${list.length} of ${state.orders.length} orders`;
}
function renderInventory(){
  const q=(document.getElementById("inventorySearch")?.value||"").toLowerCase();
  const filter=document.getElementById("stockFilter")?.value||"all";
  const products=state.products.filter(p=>(`${p.name} ${p.id}`.toLowerCase().includes(q))&&(filter==="all"||(filter==="low"?p.stock<=p.reorder:p.stock>p.reorder)));
  document.getElementById("invProducts").textContent=state.products.length;
  document.getElementById("invUnits").textContent=state.products.reduce((a,p)=>a+p.stock,0);
  document.getElementById("invLow").textContent=state.products.filter(p=>p.stock<=p.reorder).length;
  document.getElementById("inventoryTable").innerHTML=products.length?products.map(p=>{
    const low=p.stock<=p.reorder, pct=Math.min(100,p.stock/Math.max(p.reorder*4,1)*100);
    return `<tr><td class="customer-cell">${esc(p.name)}</td><td class="order-id">${p.id}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td><b>${p.stock}</b> units</td><td><div style="display:flex;align-items:center;gap:8px;min-width:105px"><div class="stock-track" style="flex:1"><div class="stock-fill" style="width:${pct}%;background:${low?'#f4b65f':'#35c99a'}"></div></div><small style="color:${low?'#f4b65f':'#6edbb8'}">${low?'Low':'Good'}</small></div></td><td><button class="action-btn" data-stock="${p.id}">＋ Stock</button></td></tr>`;
  }).join(""):`<tr><td colspan="7">No products found.</td></tr>`;
}
function renderWorkList(type){
  const config={
    picking:{target:"pickingList",statuses:["Pending"],next:"Picking",label:"Mark as picked",empty:"No orders waiting for picking.",desc:"Collect the listed product from its warehouse location."},
    packing:{target:"packingList",statuses:["Picking"],next:"Packed",label:"Confirm packed",empty:"No orders waiting for packing.",desc:"Verify the product and prepare a secure package."},
    dispatch:{target:"dispatchList",statuses:["Packed"],next:"Dispatched",label:"Confirm dispatch",empty:"No packed orders waiting for dispatch.",desc:"Shipment confirmed. The order will move to dispatched."}
  }[type];
  const list=state.orders.filter(o=>config.statuses.includes(o.status));
  document.getElementById(config.target).innerHTML=list.length?list.map(o=>`<article class="work-card"><div class="work-head"><strong>${o.id}</strong>${badge(o.status)}</div><h3>${esc(o.customer)}</h3><p>${config.desc}</p><div class="item-chips"><span class="item-chip">${esc(o.product)} × ${o.quantity}</span><span class="item-chip">${money(orderTotal(o))}</span></div><p>Deliver to: ${esc(o.address)}</p><button class="primary-btn" data-progress="${o.id}" data-next="${config.next}">${config.label} →</button></article>`).join(""):`<div class="empty-state"><strong>All caught up!</strong>${config.empty}</div>`;
}
function renderReports(){
  const orders=state.orders,total=orders.length,delivered=orders.filter(o=>o.status==="Delivered").length;
  document.getElementById("reportRate").textContent=(total?Math.round(delivered/total*100):0)+"%";
  document.getElementById("reportRevenue").textContent=money(orders.reduce((a,o)=>a+orderTotal(o),0));
  document.getElementById("reportUnits").textContent=orders.reduce((a,o)=>a+o.quantity,0);
  const statuses=["Pending","Picking","Packed","Dispatched","Delivered"];
  document.getElementById("reportBars").innerHTML=statuses.map((s,i)=>{const n=orders.filter(o=>o.status===s).length;return `<div class="report-bar-row"><span>${s}</span><div class="pipe-track"><div class="pipe-fill ${["processing","processing","packed","dispatched","dispatched"][i]}" style="width:${total?n/total*100:0}%"></div></div><b>${n}</b></div>`}).join("");
  document.getElementById("inventorySnapshot").innerHTML=state.products.map(p=>`<div class="snapshot-row"><span>${esc(p.name)}</span><div class="stock-track"><div class="stock-fill" style="width:${Math.min(100,p.stock/Math.max(p.reorder*4,1)*100)}%;background:${p.stock<=p.reorder?'#f4b65f':'#5b8cff'}"></div></div><b>${p.stock}</b></div>`).join("");
}
function renderAll(){
  renderDashboard(); renderOrders(); renderInventory(); renderWorkList("picking"); renderWorkList("packing"); renderWorkList("dispatch"); renderReports(); populateProducts();
}
function populateProducts(){
  const select=document.getElementById("orderProduct"), current=select.value;
  select.innerHTML=state.products.map(p=>`<option value="${esc(p.name)}">${esc(p.name)} · ${money(p.price)} · ${p.stock} in stock</option>`).join("");
  if(state.products.some(p=>p.name===current))select.value=current;
}
function openModal(){populateProducts();document.getElementById("modalBackdrop").classList.add("show");}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("show");document.getElementById("orderForm").reset();}
function createOrder(form){
  const data=new FormData(form), customer=data.get("customer").trim(), product=data.get("product"), quantity=Number(data.get("quantity")), address=data.get("address").trim();
  const p=productByName(product);
  if(!p){showToast("Please add a product first.");return;}
  if(quantity<1||!Number.isInteger(quantity)){showToast("Enter a valid quantity.");return;}
  if(quantity>p.stock){showToast(`Only ${p.stock} units are available.`);return;}
  p.stock-=quantity;
  const nextNum=Math.max(2400,...state.orders.map(o=>Number(o.id.replace("WF-",""))||0))+1;
  state.orders.push({id:`WF-${nextNum}`,customer,product,quantity,address,date:new Date().toISOString().slice(0,10),status:"Pending"});
  saveState();closeModal();renderAll();showToast("New order created successfully.");
}
function progressOrder(id,next){
  const order=state.orders.find(o=>o.id===id);if(!order)return;
  order.status=next;
  if(next==="Dispatched")showToast(`${id} has been dispatched.`);
  else showToast(`${id} moved to ${next.toLowerCase()}.`);
  saveState();renderAll();
}
function deleteOrder(id){
  if(!confirm(`Delete ${id}? This cannot be undone.`))return;
  const order=state.orders.find(o=>o.id===id);
  if(order && ["Pending","Picking"].includes(order.status)){
    const p=productByName(order.product);if(p)p.stock+=order.quantity;
  }
  state.orders=state.orders.filter(o=>o.id!==id);saveState();renderAll();showToast("Order deleted.");
}
function addProduct(){
  const name=prompt("Product name:");if(!name||!name.trim())return;
  const category=prompt("Category:", "General")||"General";
  const price=Number(prompt("Unit price (₹):","499"));
  const stock=Number(prompt("Opening stock:","20"));
  if(!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0){showToast("Enter valid price and stock.");return;}
  const skuNum=Math.max(1000,...state.products.map(p=>Number(p.id.replace("SKU-",""))||0))+1;
  state.products.push({id:`SKU-${skuNum}`,name:name.trim(),category,price,stock,reorder:5});
  saveState();renderAll();showToast("Product added to inventory.");
}
function addStock(id){
  const p=state.products.find(x=>x.id===id);if(!p)return;
  const qty=Number(prompt(`Add units to ${p.name}:`,"10"));
  if(!Number.isInteger(qty)||qty<=0){showToast("Enter a positive whole number.");return;}
  p.stock+=qty;saveState();renderAll();showToast(`${qty} units added.`);
}
function exportCSV(){
  const rows=[["Order ID","Customer","Product","Quantity","Address","Date","Status","Amount"],...state.orders.map(o=>[o.id,o.customer,o.product,o.quantity,o.address,o.date,o.status,orderTotal(o)])];
  const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="wareflow-orders-report.csv";a.click();URL.revokeObjectURL(url);showToast("CSV report exported.");
}
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-page]");if(nav)goTo(nav.dataset.page);
  const goto=e.target.closest("[data-goto]");if(goto)goTo(goto.dataset.goto);
  const action=e.target.closest("[data-action]");if(action&&action.dataset.action==="new-order")openModal();
  const progress=e.target.closest("[data-progress]");if(progress)progressOrder(progress.dataset.progress,progress.dataset.next);
  const del=e.target.closest("[data-delete]");if(del)deleteOrder(del.dataset.delete);
  const stock=e.target.closest("[data-stock]");if(stock)addStock(stock.dataset.stock);
});
document.getElementById("orderForm").addEventListener("submit",e=>{e.preventDefault();createOrder(e.target);});
document.getElementById("closeModal").addEventListener("click",closeModal);
document.getElementById("cancelModal").addEventListener("click",closeModal);
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
document.getElementById("orderSearch").addEventListener("input",renderOrders);
document.getElementById("orderFilter").addEventListener("change",renderOrders);
document.getElementById("inventorySearch").addEventListener("input",renderInventory);
document.getElementById("stockFilter").addEventListener("change",renderInventory);
document.getElementById("addProductBtn").addEventListener("click",addProduct);
document.getElementById("exportBtn").addEventListener("click",exportCSV);
document.getElementById("mobileMenu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset all demo data to the original sample? Your changes will be lost.")){
    state=structuredClone(starterData);saveState();renderAll();showToast("Demo data has been reset.");
  }
});
document.getElementById("helpBtn").addEventListener("click",()=>alert("Quick guide:\n1. Create an order from Dashboard or Orders.\n2. Pick it from the Picking section.\n3. Confirm packing in Packing.\n4. Confirm shipment in Dispatch.\n5. View performance in Reports.\n\nAll demo data is saved in this browser using LocalStorage."));
renderAll();
