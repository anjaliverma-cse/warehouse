import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA9a4-5bdH7nGx0Btjk8cG1xWNZHp7pD2g',
  authDomain: 'wareflow-b9258.firebaseapp.com',
  projectId: 'wareflow-b9258',
  storageBucket: 'wareflow-b9258.firebasestorage.app',
  messagingSenderId: '427556220688',
  appId: '1:427556220688:web:1e8b013c480aa0082dbf95',
  measurementId: 'G-PCBSK03NKR'
};
const screen=document.getElementById('authScreen'), form=document.getElementById('authForm'), toggle=document.getElementById('authToggle'), help=document.getElementById('authHelp'), submit=document.getElementById('authSubmit');
let creating=false, demoMode=false, app, auth, db, stopSync=null, lastSynced='';
function message(s){help.textContent=s;}
function enterDemo(){demoMode=true;screen.classList.add('hidden');document.getElementById('connectionStatus').innerHTML='<i></i> Local demo mode';}
const demo=document.createElement('button');demo.type='button';demo.className='secondary-btn demo-entry';demo.textContent='Continue in demo mode';demo.addEventListener('click',enterDemo);form.after(demo);
toggle.addEventListener('click',()=>{creating=!creating;submit.textContent=creating?'Create account':'Sign in';toggle.textContent=creating?'Already have an account? Sign in':'Create an account instead';message(creating?'New accounts are created with staff access. An administrator must approve elevated permissions.':'Sign in with your Firebase account.');});
try {
  app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app);
  isSupported().then(ok=>{if(ok)getAnalytics(app);}).catch(()=>{});
  document.getElementById('connectionStatus').innerHTML='<i></i> Firebase connected';
} catch(e){message('Firebase could not initialize. You can continue in local demo mode.');}
form.addEventListener('submit',async e=>{
  e.preventDefault(); if(!auth){message('Firebase is unavailable. Continue in demo mode or check your configuration.');return;}
  const email=document.getElementById('authEmail').value.trim(), password=document.getElementById('authPassword').value;
  submit.disabled=true;submit.textContent='Please wait…';
  try{
    if(creating){const cred=await createUserWithEmailAndPassword(auth,email,password);await setDoc(doc(db,'users',cred.user.uid),{email,role:'staff',displayName:email.split('@')[0],createdAt:serverTimestamp()});message('Account created. Ask your workspace administrator to grant the required role if needed.');}
    else await signInWithEmailAndPassword(auth,email,password);
  }catch(err){message(err.code==='auth/invalid-credential'?'Email or password is incorrect.':err.code==='auth/email-already-in-use'?'This email already has an account. Sign in instead.':err.message);}
  finally{submit.disabled=false;submit.textContent=creating?'Create account':'Sign in';}
});
function showApp(user,attempt=0){screen.classList.add('hidden');document.getElementById('connectionStatus').innerHTML='<i></i> Signed in · Firebase';document.getElementById('signOutBtn').style.display='inline-flex';
  const profileRef=doc(db,'users',user.uid);
  getDoc(profileRef).then(snap=>{if(!snap.exists()){if(attempt<3){setTimeout(()=>showApp(user,attempt+1),700);return;}message('Account profile is missing. Contact the workspace administrator.');screen.classList.remove('hidden');return;}const role=snap.data().role;if(!['admin','staff'].includes(role)){message('Your account does not have warehouse workspace access. Ask an administrator to assign the staff or admin role.');screen.classList.remove('hidden');return;}
    document.querySelector('.profile strong').textContent=snap.data().displayName||user.email;document.querySelector('.profile span').textContent=role.toUpperCase();
    const ref=doc(db,'workspaces','main');
    stopSync=onSnapshot(ref,snap=>{if(snap.exists()&&snap.data().appState){const cloud=snap.data();const incoming=JSON.stringify(cloud.appState);['suppliers','staff','notifications'].forEach(k=>{if(cloud[k])localStorage.setItem('wareflow_'+k,JSON.stringify(cloud[k]));});window.dispatchEvent(new Event('wareflow-cloud-updated'));if(incoming!==(localStorage.getItem('wareflow_project_v1')||'')){lastSynced=incoming;localStorage.setItem('wareflow_project_v1',incoming);window.location.reload();}else{lastSynced=incoming;}}else if(!snap.exists()){const initial=JSON.parse(localStorage.getItem('wareflow_project_v1')||'{"products":[],"orders":[]}');setDoc(ref,{appState:initial,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:true}).catch(err=>message('Initial cloud setup failed: '+err.message));}},err=>message('Firestore read failed: '+err.message));
    let prior=localStorage.getItem('wareflow_project_v1')||'';
    setInterval(async()=>{const current=localStorage.getItem('wareflow_project_v1')||'';const extra={};['suppliers','staff','notifications'].forEach(k=>{try{extra[k]=JSON.parse(localStorage.getItem('wareflow_'+k)||'[]');}catch{extra[k]=[];}});const signature=current+JSON.stringify(extra);if(current&&signature!==prior){try{const data=JSON.parse(current);await setDoc(ref,{appState:data,...extra,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:true});prior=signature;lastSynced=current;}catch(err){message('Cloud save failed. Check Firestore rules: '+err.message);}}},1800);
  }).catch(err=>{message('Could not verify your workspace role: '+err.message);screen.classList.remove('hidden');});
}
onAuthStateChanged(auth,user=>{if(user)showApp(user);else{if(stopSync)stopSync();if(!demoMode)screen.classList.remove('hidden');document.getElementById('connectionStatus').innerHTML='<i></i> Signed out';}});
window.wareflowSignOut=()=>signOut(auth).then(()=>{window.location.reload();});
