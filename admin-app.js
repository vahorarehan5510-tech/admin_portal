const firebaseConfig = {
    apiKey: "AIzaSyBi2WCy7rGfQ5Ie7ckR6SgeVPIsdPFWck8",
    authDomain: "diploma-study-portal.firebaseapp.com",
    databaseURL: "https://diploma-study-portal-default-rtdb.firebaseio.com/",
    projectId: "diploma-study-portal",
    storageBucket: "diploma-study-portal.firebasestorage.app",
    messagingSenderId: "233448737809",
    appId: "1:233448737809:web:8f34ab9caa3d0f521ab5b0"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

const baseStaticBranches = ["Computer", "Chemical", "IT", "Civil", "Mechanical"];
let db = { branches: {}, pyqs: {} };

window.onload = function() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && user.email === "vahorarehan5510@gmail.com") {
            document.getElementById('admin-auth-screen').classList.add('hidden');
            document.getElementById('admin-dashboard-screen').classList.remove('hidden');
            document.getElementById('admin-email-display').innerText = user.email;
            listenToDatabase();
        } else {
            if(user) {
                alert("Access Denied: Unrecognized Admin Domain ID.");
                firebase.auth().signOut();
            }
            document.getElementById('admin-dashboard-screen').classList.add('hidden');
            document.getElementById('admin-auth-screen').classList.remove('hidden');
        }
    });
};

function processAdminLogin() {
    firebase.auth().signInWithPopup(googleProvider).catch(() => {
        firebase.auth().signInWithRedirect(googleProvider);
    });
}

function adminLogout() {
    firebase.auth().signOut().then(() => { location.reload(); });
}

function listenToDatabase() {
    database.ref('portal_db').on('value', (snapshot) => {
        if(snapshot.exists()) {
            db = snapshot.val();
            if(!db.branches) db.branches = {};
            if(!db.pyqs) db.pyqs = {};
            baseStaticBranches.forEach(b => { if(!db.branches[b]) db.branches[b] = {}; });
        }
        updateAdminDropdowns();
        calculateLiveCounters();
    });
}

function saveDB() { database.ref('portal_db').set(db); }

function adminNext(curr, next) { 
    document.querySelectorAll('.admin-step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`admin-step-${next}`).classList.remove('hidden'); 
}

function calculateLiveCounters() {
    let totalBranches = db.branches ? Object.keys(db.branches).length : 0;
    let totalSubjects = 0;
    if(db.branches) {
        Object.keys(db.branches).forEach(b => {
            Object.keys(db.branches[b]).forEach(sem => {
                let subs = db.branches[b][sem] || {}; totalSubjects += Object.keys(subs).length;
            });
        });
    }
    document.getElementById('stat-branches').innerText = totalBranches;
    document.getElementById('stat-subjects').innerText = totalSubjects;
    database.ref('registered_students').once('value').then(snap => {
        document.getElementById('stat-students').innerText = snap.exists() ? Object.keys(snap.val()).length : 0;
    });
}

function updateAdminDropdowns() {
    let bSelects = ['adm-sub-branch-select', 'adm-ch-branch-select', 'adm-mat-branch-select', 'adm-del-branch-select', 'adm-pyq-branch-select', 'adm-syl-branch-select'];
    let branchList = (db && db.branches && Object.keys(db.branches).length > 0) ? Object.keys(db.branches) : baseStaticBranches;
    bSelects.forEach(id => {
        let el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">-- Select Branch --</option>'; branchList.forEach(b => { el.innerHTML += `<option value="${b}">${b}</option>`; }); }
    });
}

function updateAdminSemSelect(bId, sId) {
    let branch = document.getElementById(bId).value; let sSelect = document.getElementById(sId);
    sSelect.innerHTML = '<option value="">-- Select Semester --</option>';
    if(branch) { for(let i=1; i<=6; i++) { sSelect.innerHTML += `<option value="Sem ${i}">Sem ${i}</option>`; } }
}

// FIXED CRITICAL LOGIC MISMATCH: PYQ અપલોડ માટે પણ સબ્જેક્ટ હંમેશા ઓરિજિનલ db.branches માંથી જ લોડ થશે
function updateAdminSubSelect(bId, sId, subId) {
    let branch = document.getElementById(bId).value; 
    let sem = document.getElementById(sId).value; 
    let subSelect = document.getElementById(subId);
    
    subSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    
    if(branch && sem && db.branches && db.branches[branch] && db.branches[branch][sem]) { 
        Object.keys(db.branches[branch][sem]).forEach(sub => { 
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`; 
        }); 
    }
}

function updateAdminChSelect() {
    let branch = document.getElementById('adm-mat-branch-select').value; let sem = document.getElementById('adm-mat-sem-select').value; let sub = document.getElementById('adm-mat-sub-select').value; let chSelect = document.getElementById('adm-mat-ch-select');
    chSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
    if(branch && sem && sub && db.branches[branch][sem][sub] && db.branches[branch][sem][sub].chapters) { 
        db.branches[branch][sem][sub].chapters.forEach((ch, idx) => { chSelect.innerHTML += `<option value="${idx}">${ch.name}</option>`; }); 
    }
}

function addBranch() {
    let name = document.getElementById('adm-branch-name').value.trim();
    if(name) { if(!db.branches[name]) db.branches[name] = {}; saveDB(); alert(`Branch "${name}" saved.`); document.getElementById('adm-branch-name').value = ""; adminNext(2, 1); }
}

function addSubject() {
    let branch = document.getElementById('adm-sub-branch-select').value; 
    let sem = document.getElementById('adm-sub-sem-select').value; 
    let sub = document.getElementById('adm-sub-name').value.trim();
    let price = document.getElementById('adm-sub-price').value.trim() || 0;
    
    if(branch && sem && sub) {
        if(!db.branches[branch]) db.branches[branch] = {}; 
        if(!db.branches[branch][sem]) db.branches[branch][sem] = {};
        db.branches[branch][sem][sub] = { price: parseInt(price), chapters: [], syllabus: "" }; 
        saveDB(); 
        alert(`Subject "${sub}" successfully added!`);
        document.getElementById('adm-sub-name').value = "";
        adminNext(4, 1);
    } else { alert("Please fill all fields!"); }
}

function addSyllabusLink() {
    let branch = document.getElementById('adm-syl-branch-select').value;
    let sem = document.getElementById('adm-syl-sem-select').value;
    let sub = document.getElementById('adm-syl-sub-select').value;
    let link = document.getElementById('adm-syl-link').value.trim();

    if(branch && sem && sub && link) {
        if(!db.branches[branch][sem][sub]) db.branches[branch][sem][sub] = { chapters: [], price: 0 };
        db.branches[branch][sem][sub].syllabus = link;
        saveDB();
        alert("Syllabus configuration updated successfully!");
        document.getElementById('adm-syl-link').value = "";
        adminNext('syllabus', 1);
    } else { alert("Please fill all information!"); }
}

function addChapter() {
    let branch = document.getElementById('adm-ch-branch-select').value; 
    let sem = document.getElementById('adm-ch-sem-select').value; 
    let sub = document.getElementById('adm-ch-sub-select').value; 
    let chName = document.getElementById('adm-ch-name').value.trim();
    
    if(branch && sem && sub && chName) { 
        if(!db.branches[branch][sem][sub].chapters) db.branches[branch][sem][sub].chapters = [];
        db.branches[branch][sem][sub].chapters.push({ name: chName, yt: "#", pdf: "#" }); 
        saveDB(); alert(`Chapter "${chName}" added successfully.`); 
        document.getElementById('adm-ch-name').value = "";
        adminNext(5, 1);
    } else { alert("Parameters dynamic error!"); }
}

function addMaterial() {
    let branch = document.getElementById('adm-mat-branch-select').value; let sem = document.getElementById('adm-mat-sem-select').value; let sub = document.getElementById('adm-mat-sub-select').value; let chIdx = document.getElementById('adm-mat-ch-select').value; let yt = document.getElementById('adm-mat-yt').value.trim(); let pdf = document.getElementById('adm-mat-pdf').value.trim();
    if(branch && sem && sub && chIdx !== "") { 
        let ch = db.branches[branch][sem][sub].chapters[chIdx];
        if(yt) ch.yt = yt; if(pdf) ch.pdf = pdf; 
        saveDB(); alert("Cloud content streams updated!"); 
        document.getElementById('adm-mat-yt').value = "";
        document.getElementById('adm-mat-pdf').value = "";
        adminNext(6, 1);
    }
}

function addPYQ() {
    let branch = document.getElementById('adm-pyq-branch-select').value; let sem = document.getElementById('adm-pyq-sem-select').value; let sub = document.getElementById('adm-pyq-sub-select').value; let year = document.getElementById('adm-pyq-year').value.trim(); let link = document.getElementById('adm-pyq-link').value.trim();
    if(branch && sem && sub && year && link) {
        if(!db.pyqs) db.pyqs = {}; if(!db.pyqs[branch]) db.pyqs[branch] = {}; if(!db.pyqs[branch][sem]) db.pyqs[branch][sem] = {}; if(!db.pyqs[branch][sem][sub]) db.pyqs[branch][sem][sub] = [];
        db.pyqs[branch][sem][sub].push({ year: year, link: link }); 
        saveDB(); alert(`Past paper for ${year} linked.`);
        document.getElementById('adm-pyq-year').value = "";
        document.getElementById('adm-pyq-link').value = "";
        adminNext('pyq', 1);
    }
}

function postNotification() {
    let text = document.getElementById('adm-notif-text').value.trim();
    if(text) {
        database.ref('notifications').push({ text: text, time: firebase.database.ServerValue.TIMESTAMP });
        alert("Notification pushed to global portal!");
        document.getElementById('adm-notif-text').value = "";
        adminNext('notif', 1);
    }
}

function openDeleteManager() { adminNext(1, 'delete'); document.getElementById('delete-items-list').innerHTML = "<p style='color:#94a3b8; text-align:center;'>Select filter criteria above...</p>"; }

function renderDeleteItems() {
    let branch = document.getElementById('adm-del-branch-select').value; let sem = document.getElementById('adm-del-sem-select').value; let container = document.getElementById('delete-items-list'); container.innerHTML = "";
    if(!branch || !sem || !db.branches[branch] || !db.branches[branch][sem] || Object.keys(db.branches[branch][sem]).length === 0) { container.innerHTML = "<p style='color:#ef4444; text-align:center;'>No structural data found.</p>"; return; }
    let subjects = db.branches[branch][sem];
    Object.keys(subjects).forEach(subName => {
        let div = document.createElement('div'); div.className = "admin-manage-item"; div.innerHTML = `<div class="admin-manage-header"><span>📘 ${subName} (₹${subjects[subName].price || 0})</span><button style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:16px;" onclick="deleteItem('${branch}', '${sem}', '${subName}')">❌</button></div>`;
        if(subjects[subName].chapters) {
            subjects[subName].chapters.forEach((ch, idx) => {
                let chDiv = document.createElement('div'); chDiv.style.margin = "10px 0 0 10px"; chDiv.innerHTML = `<div style="font-size:13px; color:#cbd5e1;">📄 ${ch.name}</div>
                    <div class="admin-manage-buttons"><button style="background:none; border:none; color:#fbbf24; cursor:pointer; font-size:14px;" onclick="editItem('${branch}', '${sem}', '${subName}', ${idx})">✏️ Edit</button><button style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; margin-left:15px;" onclick="deleteItem('${branch}', '${sem}', '${subName}', ${idx})">❌ Remove</button></div>`;
                div.appendChild(chDiv);
            });
        }
        container.appendChild(div);
    });
}

function deleteItem(branch, sem, subName, chIdx = null) {
    if (chIdx === null) { if (confirm(`Delete subject data completely?`)) { delete db.branches[branch][sem][subName]; } } 
    else { if (confirm(`Remove this specific chapter?`)) { db.branches[branch][sem][subName].chapters.splice(chIdx, 1); } }
    saveDB(); renderDeleteItems();
}

function editItem(branch, sem, subName, chIdx) {
    let ch = db.branches[branch][sem][subName].chapters[chIdx]; let newName = prompt("New Chapter Name:", ch.name); let newYt = prompt("New YouTube Link:", ch.yt); let newPdf = prompt("New PDF Link:", ch.pdf);
    if (newName) ch.name = newName; if (newYt) ch.yt = newYt; if (newPdf) ch.pdf = newPdf; saveDB(); renderDeleteItems();
}

function openStudentManager() {
    adminNext(1, 'students');
    let listContainer = document.getElementById('admin-student-list');
    listContainer.innerHTML = "<p style='color:#94a3b8; text-align:center;'>Fetching cluster arrays...</p>";
    database.ref('registered_students').once('value').then(snap => {
        listContainer.innerHTML = "";
        if(snap.exists()) {
            let students = snap.val();
            Object.keys(students).forEach(uid => {
                let s = students[uid];
                let div = document.createElement('div');
                div.className = "user-list-item";
                div.innerHTML = `
                    <div class="user-list-info">
                        <div>${s.name}</div>
                        <span>ID: ${s.enroll || 'N/A'}<br>${s.branch} | ${s.sem}</span>
                    </div>
                    <button class="btn-admin btn-danger-admin" style="padding: 8px 12px; font-size:12px; width:auto;" onclick="deleteStudent('${uid}', '${s.name}')">Delete</button>
                `;
                listContainer.appendChild(div);
            });
        }
    });
}

function deleteStudent(uid, name) {
    if(confirm(`Are you sure you want to permanently delete: ${name}?`)) {
        database.ref('registered_students/' + uid).remove().then(() => { alert("Record purged."); openStudentManager(); });
    }
}

function openPaymentManager() {
    adminNext(1, 'payments');
    let listContainer = document.getElementById('admin-payment-list');
    listContainer.innerHTML = "<p style='color:#94a3b8; text-align:center;'>Reading stream snapshot...</p>";
    database.ref('payment_requests').on('value', snap => {
        listContainer.innerHTML = "";
        if(snap.exists()) {
            snap.forEach(child => {
                let reqId = child.key; let r = child.val();
                database.ref(`registered_students/${r.uid}`).once('value').then(sSnap => {
                    let sName = sSnap.exists() ? sSnap.val().name : "Unknown Student";
                    let sEnroll = sSnap.exists() ? sSnap.val().enroll : "N/A";
                    let div = document.createElement('div');
                    div.className = "admin-manage-item";
                    div.innerHTML = `
                        <div style="font-size:13.5px; color:#cbd5e1; line-height:1.6;">
                            <b>User:</b> ${sName} (${sEnroll})<br>
                            <b>Target:</b> <span style="color:#38bdf8;">${r.subject}</span> (Price: ₹${r.price})<br>
                            <b>UTR ID:</b> <span style="color:#10b981; font-weight:600;">${r.utr}</span>
                        </div>
                        <div class="admin-btn-group" style="margin-top:12px;">
                            <button class="btn-admin" style="background:#10b981; padding:8px; font-size:13px;" onclick="approvePayment('${reqId}', '${r.uid}', '${r.subject}')">Approve ✅</button>
                            <button class="btn-admin btn-danger-admin" style="padding:8px; font-size:13px;" onclick="rejectPayment('${reqId}', '${r.uid}', '${r.subject}')">Reject ❌</button>
                        </div>
                    `;
                    listContainer.appendChild(div);
                });
            });
        } else {
            listContainer.innerHTML = "<p style='color:#94a3b8; text-align:center;'>No pending verification queues. 🎉</p>";
        }
    });
}

function approvePayment(reqId, uid, subject) {
    if(confirm(`Verify ledger match and unlock "${subject}"?`)) {
        database.ref(`registered_students/${uid}/unlocked_subjects/${subject}`).set("approved").then(() => {
            database.ref(`payment_requests/${reqId}`).remove().then(() => { alert("Access granted!"); openPaymentManager(); });
        });
    }
}

function rejectPayment(reqId, uid, subject) {
    if(confirm("Deny execution and clear tracking branch?")) {
        database.ref(`registered_students/${uid}/unlocked_subjects/${subject}`).remove().then(() => {
            database.ref(`payment_requests/${reqId}`).remove().then(() => { alert("Request declined."); openPaymentManager(); });
        });
    }
}
