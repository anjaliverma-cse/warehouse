(() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  let suppliers = read('wareflow_suppliers', [
    {id:1,name:'Northstar Components',contact:'+91 98765 43210',email:'sales@northstar.example',category:'Electronics'},
    {id:2,name:'Office Essentials Co.',contact:'+91 98111 22334',email:'orders@officeessentials.example',category:'Stationery'}
  ]);
  let staff = read('wareflow_staff', [{id:1,name:'Project Admin',role:'Administrator',email:'admin@wareflow.demo',status:'Active'}]);
  let notifications = read('wareflow_notifications', []);
  function notify(title, detail, type='info') {
    notifications.unshift({id:Date.now()+Math.random(),title,detail,type,date:new Date().toLocaleString(),read:false});
    notifications = notifications.slice(0,80); write('wareflow_notifications',notifications); renderNotifications();
  }
  function renderSuppliers(){ $('suppliersTable').innerHTML=suppliers.length?suppliers.map(x=>`<tr><td class="customer-cell">${safe(x.name)}</td><td>${safe(x.contact)}</td><td>${safe(x.email)}</td><td>${safe(x.category)}</td><td><button class="action-btn" data-supplier-delete="${x.id}">Remove</button></td></tr>`).join(''):'<tr><td colspan="5">No suppliers added yet.</td></tr>'; }
  function renderStaff(){ $('staffTable').innerHTML=staff.length?staff.map(x=>`<tr><td class="customer-cell">${safe(x.name)}</td><td>${safe(x.role)}</td><td>${safe(x.email)}</td><td>${safe(x.status)}</td><td><button class="action-btn" data-staff-delete="${x.id}">Remove</button></td></tr>`).join(''):'<tr><td colspan="5">No team members added.</td></tr>'; }
  function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderNotifications(){ $('notificationList').innerHTML=notifications.length?notifications.map(n=>`<article class="notification-item ${n.read?'read':''}"><span class="notification-icon ${n.type}">${n.type==='warning'?'!':'•'}</span><div><b>${safe(n.title)}</b><p>${safe(n.detail)}</p><small>${safe(n.date)}</small></div><button class="action-btn" data-notification-read="${n.id}">${n.read?'Read':'Mark read'}</button></article>`).join(''):'<div class="empty-state"><strong>You are all caught up</strong>New stock and order alerts will appear here.</div>'; $('navAlertCount').textContent=notifications.filter(n=>!n.read).length; }
  function renderAnalytics(){
    const orders=window.wareflowState?.orders || [], products=window.wareflowState?.products || [];
    const total=orders.length, revenue=orders.reduce((a,o)=>a+(Number(o.quantity)||0)*(Number(o.unitPrice)||Number(products.find(p=>p.name===o.product)?.price)||0),0);
    $('avgOrderValue').textContent=fmt(total?revenue/total:0); $('analyticsStock').textContent=products.reduce((a,p)=>a+Number(p.stock||0),0); $('analyticsLow').textContent=products.filter(p=>Number(p.stock)<=Number(p.reorder)).length;
    const statuses=['Pending','Picking','Packed','Dispatched','Delivered'];
    $('analyticsStatus').innerHTML=statuses.map((st,i)=>{const n=orders.filter(o=>o.status===st).length;return `<div class="report-bar-row"><span>${st}</span><div class="pipe-track"><div class="pipe-fill ${['processing','processing','packed','dispatched','dispatched'][i]}" style="width:${total?n/total*100:0}%"></div></div><b>${n}</b></div>`}).join('');
    const totals={}; orders.forEach(o=>totals[o.product]=(totals[o.product]||0)+Number(o.quantity||0));
    $('topProducts').innerHTML=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,n])=>`<div class="snapshot-row"><span>${safe(name)}</span><div class="stock-track"><div class="stock-fill" style="width:${Math.min(100,n/Math.max(1,...Object.values(totals))*100)}%"></div></div><b>${n}</b></div>`).join('')||'<p class="muted-note">No order data yet.</p>';
  }
  function track(){const id=$('trackingSearch').value.trim().toUpperCase(), o=(window.wareflowState?.orders||[]).find(x=>x.id.toUpperCase()===id); if(!o){$('trackingResult').innerHTML='<div class="empty-state"><strong>Order not found</strong>Check the ID and try again.</div>';return;}
    const stages=['Pending','Picking','Packed','Dispatched','Delivered'], current=stages.indexOf(o.status);
    $('trackingResult').innerHTML=`<div class="tracking-head"><div><span class="eyebrow">SHIPMENT ${safe(o.id)}</span><h2>${safe(o.customer)}</h2><p>${safe(o.address)}</p></div>${statusBadge(o.status)}</div><div class="tracking-steps">${stages.map((s,i)=>`<div class="tracking-step ${i<=current?'done':''}"><span>${i<current?'✓':i+1}</span><b>${s}</b></div>`).join('')}</div><p class="muted-note">Product: ${safe(o.product)} · Quantity: ${o.quantity} · Order date: ${safe(o.date)}</p>`;
  }
  function statusBadge(s){return `<span class="status ${String(s).toLowerCase()}">${safe(s)}</span>`;}
  function setupBarcode(){const sel=$('barcodeProduct'), products=window.wareflowState?.products||[]; sel.innerHTML=products.map(p=>`<option value="${safe(p.id)}">${safe(p.name)} (${safe(p.id)})</option>`).join('');}
  function generateBarcode(){const p=(window.wareflowState?.products||[]).find(x=>x.id===$('barcodeProduct').value); if(!p)return; if(!window.JsBarcode){alert('Barcode library could not load. Check your internet connection.');return;} window.JsBarcode('#barcodeSvg',p.id,{format:'CODE128',lineColor:'#111827',background:'#ffffff',width:2,height:72,displayValue:true,fontSize:14,margin:12}); $('barcodeOutput').classList.add('visible');}
  let scanner=null, lastOrderStatuses={};
  async function startScanner(){if(!window.Html5Qrcode){$('scanResult').textContent='Scanner library could not load.';return;} try{scanner=new Html5Qrcode('scannerReader');await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:230,height:120}},decoded=>{$('scanResult').textContent='Scanned: '+decoded;const p=(window.wareflowState?.products||[]).find(x=>x.id===decoded);if(p){goTo('inventory');$('inventorySearch').value=p.id;$('inventorySearch').dispatchEvent(new Event('input'));}else{$('trackingSearch').value=decoded;$('scanResult').textContent='Scanned: '+decoded+' (not a matching SKU)';}},()=>{});}catch(e){$('scanResult').textContent='Camera unavailable: '+e.message;}}
  async function stopScanner(){if(scanner){try{await scanner.stop();scanner.clear();}catch{}scanner=null;}}
  document.addEventListener('click',e=>{
    const sd=e.target.closest('[data-supplier-delete]');if(sd){suppliers=suppliers.filter(x=>x.id!=sd.dataset.supplierDelete);write('wareflow_suppliers',suppliers);renderSuppliers();}
    const td=e.target.closest('[data-staff-delete]');if(td){staff=staff.filter(x=>x.id!=td.dataset.staffDelete);write('wareflow_staff',staff);renderStaff();}
    const nr=e.target.closest('[data-notification-read]');if(nr){notifications=notifications.map(n=>String(n.id)===nr.dataset.notificationRead?{...n,read:true}:n);write('wareflow_notifications',notifications);renderNotifications();}
  });
  $('addSupplierBtn').addEventListener('click',()=>{const name=prompt('Supplier / company name:');if(!name)return;const contact=prompt('Contact number:')||'';const email=prompt('Email address:')||'';const category=prompt('Product category:')||'General';suppliers.push({id:Date.now(),name,contact,email,category});write('wareflow_suppliers',suppliers);renderSuppliers();notify('Supplier added',`${name} was added to the supplier directory.`);});
  $('addStaffBtn').addEventListener('click',()=>{const name=prompt('Staff member name:');if(!name)return;const role=prompt('Role (Picker / Packer / Supervisor):','Picker')||'Staff';const email=prompt('Work email:')||'';staff.push({id:Date.now(),name,role,email,status:'Active'});write('wareflow_staff',staff);renderStaff();notify('Team member added',`${name} was added to the staff directory.`);});
  $('trackBtn').addEventListener('click',track); $('trackingSearch').addEventListener('keydown',e=>{if(e.key==='Enter')track();});
  $('refreshAnalytics').addEventListener('click',()=>{renderAnalytics();showToast('Analytics refreshed.');});
  $('clearNotifications').addEventListener('click',()=>{notifications=notifications.filter(n=>!n.read);write('wareflow_notifications',notifications);renderNotifications();});
  $('exportExcel').addEventListener('click',()=>{const orders=window.wareflowState?.orders||[];if(!window.XLSX){showToast('Excel library unavailable.');return;}const rows=orders.map(o=>({Order:o.id,Customer:o.customer,Product:o.product,Quantity:o.quantity,Address:o.address,Date:o.date,Status:o.status}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Orders');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(window.wareflowState?.products||[]),'Inventory');XLSX.writeFile(wb,'wareflow-report.xlsx');});
  $('exportPDF').addEventListener('click',()=>{document.body.classList.add('print-report');window.print();setTimeout(()=>document.body.classList.remove('print-report'),500);});
  $('generateBarcode').addEventListener('click',generateBarcode); $('printBarcode').addEventListener('click',()=>window.print()); $('startScanner').addEventListener('click',startScanner); $('stopScanner').addEventListener('click',stopScanner);
  $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light-theme');localStorage.setItem('wareflow_theme',document.body.classList.contains('light-theme')?'light':'dark');});
  $('signOutBtn').addEventListener('click',()=>{if(window.wareflowSignOut)window.wareflowSignOut();else showToast('Demo mode: no Firebase session is active.');});
  if(localStorage.getItem('wareflow_theme')==='light')document.body.classList.add('light-theme');
  const oldGo=window.goTo; // navigation is delegated by the original app; render when a page is selected
  document.addEventListener('click',e=>{const n=e.target.closest('[data-page]');if(n&&['analytics','tracking','suppliers','staff','notifications','barcode'].includes(n.dataset.page)){setTimeout(()=>{renderAnalytics();renderSuppliers();renderStaff();renderNotifications();setupBarcode();},0);}});
  window.addEventListener('storage',e=>{if(e.key==='wareflow_project_v1'){try{window.wareflowState=JSON.parse(e.newValue);renderAnalytics();setupBarcode();}catch{}}});
  window.addEventListener('wareflow-cloud-updated',()=>{renderSuppliers();renderStaff();renderNotifications();});
  // Keep analytics / barcode views in sync with the existing app's local-first state.
  setInterval(()=>{try{const s=JSON.parse(localStorage.getItem('wareflow_project_v1'));if(s){window.wareflowState=s;renderAnalytics();setupBarcode();s.orders.forEach(o=>{if(lastOrderStatuses[o.id]&&lastOrderStatuses[o.id]!==o.status)notify('Order status updated',`${o.id} moved to ${o.status}.`,'info');lastOrderStatuses[o.id]=o.status;});const low=s.products.filter(p=>p.stock<=p.reorder);const key=low.map(p=>p.id).join(',');if(key&&key!==localStorage.getItem('wareflow_last_low')){localStorage.setItem('wareflow_last_low',key);notify('Low stock alert',`${low.map(p=>p.name).join(', ')} need replenishment.`,'warning');}}}catch{}},2500);
  renderSuppliers();renderStaff();renderNotifications();
})();
