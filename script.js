const defaultStudents = [
    { id: 1, roll: "CS2026001", name: "Kanak Gupta", branch: "B.Tech CSE", phone: "+91 9090909090", totalClasses: 20, attended: 18 },
    { id: 2, roll: "CS2026002", name: "Arun Kumar", branch: "B.Tech AI/ML", phone: "+91 9090909091", totalClasses: 20, attended: 19 },
    { id: 3, roll: "CS2026003", name: "Anush Raj", branch: "B.Tech CSE", phone: "+91 9090909092", totalClasses: 20, attended: 12 }, // Defaulter
    { id: 4, roll: "CS2026004", name: "Ananya Gupta", branch: "BCA", phone: "+91 9090909093", totalClasses: 20, attended: 16 },
    { id: 5, roll: "CS2026005", name: "Anurag", branch: "B.Tech CSE", phone: "+91 9090909094", totalClasses: 20, attended: 11 }, // Defaulter
    { id: 6, roll: "CS2026006", name: "Sneha Reddy", branch: "MCA", phone: "+91 9090909095", totalClasses: 20, attended: 20 },
    { id: 7, roll: "CS2026007", name: "Arjit Kumar", branch: "B.Tech AI/ML", phone: "+91 9090909096", totalClasses: 20, attended: 14 }, // Defaulter
    { id: 8, roll: "CS2026008", name: "Devansh Mishra", branch: "B.Tech CSE", phone: "+91 9090909097", totalClasses: 20, attended: 17 }
];

let students = JSON.parse(localStorage.getItem('edutrack_students')) || defaultStudents;
let attendanceRecords = JSON.parse(localStorage.getItem('edutrack_records')) || {};

const dateInput = document.getElementById('attendance-date');
const subjectSelect = document.getElementById('global-subject');
const attendanceTbody = document.getElementById('attendance-tbody');
const studentsTbody = document.getElementById('students-tbody');
const defaultersTbody = document.getElementById('defaulters-tbody');
const scanSelect = document.getElementById('simulate-student-select');

let todayChartInstance = null;
let overallChartInstance = null;

const todayStr = new Date().toISOString().split('T')[0];
dateInput.value = todayStr;
document.getElementById('current-date-display').innerText = new Date().toDateString();

function saveData() {
    localStorage.setItem('edutrack_students', JSON.stringify(students));
    localStorage.setItem('edutrack_records', JSON.stringify(attendanceRecords));
}

function getRecordKey() {
    return `${dateInput.value}_${subjectSelect.value}`;
}

function initApp() {
    renderAttendanceTable();
    renderStudentsDirectory();
    renderDefaulters();
    updateDashboardStats();
    populateScannerDropdown();
}

function renderAttendanceTable(filter = "") {
    const key = getRecordKey();
    const currentDayRecord = attendanceRecords[key] || {};
    attendanceTbody.innerHTML = "";

    students
        .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.roll.toLowerCase().includes(filter.toLowerCase()))
        .forEach(student => {
            const status = currentDayRecord[student.roll] || "Unmarked";
            const percentage = student.totalClasses > 0 ? ((student.attended / student.totalClasses) * 100).toFixed(1) : 0;

            let badgeClass = "badge-unmarked";
            if (status === "Present") badgeClass = "badge-present";
            if (status === "Absent") badgeClass = "badge-absent";
            if (status === "Leave") badgeClass = "badge-leave";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${student.roll}</b></td>
                <td>${student.name}</td>
                <td>${student.branch}</td>
                <td><b>${percentage}%</b></td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td class="status-btns">
                    <button class="btn-success" onclick="markStatus('${student.roll}', 'Present')">P</button>
                    <button class="btn-danger" onclick="markStatus('${student.roll}', 'Absent')">A</button>
                    <button class="btn-secondary" style="background:#f59e0b" onclick="markStatus('${student.roll}', 'Leave')">L</button>
                </td>
            `;
            attendanceTbody.appendChild(tr);
        });
}

window.markStatus = function(roll, newStatus) {
    const key = getRecordKey();
    if (!attendanceRecords[key]) attendanceRecords[key] = {};

    const prevStatus = attendanceRecords[key][roll];
    const student = students.find(s => s.roll === roll);

    if (student && prevStatus !== newStatus) {
        if (!prevStatus) {
            student.totalClasses += 1;
            if (newStatus === "Present") student.attended += 1;
        } else {
            if (prevStatus === "Present" && newStatus !== "Present") student.attended -= 1;
            if (prevStatus !== "Present" && newStatus === "Present") student.attended += 1;
        }
        attendanceRecords[key][roll] = newStatus;
        saveData();
        initApp();
        showToast(`Marked ${student.name} as ${newStatus}`);
    }
};

document.getElementById('mark-all-present').addEventListener('click', () => {
    students.forEach(s => markStatus(s.roll, 'Present'));
    showToast("All students marked Present!");
});

document.getElementById('mark-all-absent').addEventListener('click', () => {
    students.forEach(s => markStatus(s.roll, 'Absent'));
    showToast("All students marked Absent!");
});

function renderStudentsDirectory(filter = "") {
    studentsTbody.innerHTML = "";
    students
        .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.roll.toLowerCase().includes(filter.toLowerCase()))
        .forEach(student => {
            const percentage = student.totalClasses > 0 ? ((student.attended / student.totalClasses) * 100).toFixed(1) : 0;
            const isSafe = percentage >= 75;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${student.roll}</b></td>
                <td>${student.name}</td>
                <td>${student.branch}</td>
                <td>${student.attended} / ${student.totalClasses}</td>
                <td><b>${percentage}%</b></td>
                <td><span class="badge ${isSafe ? 'badge-present' : 'badge-absent'}">${isSafe ? 'Eligible' : 'Shortage'}</span></td>
                <td>
                    <button class="btn-danger-outline" onclick="deleteStudent('${student.roll}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            studentsTbody.appendChild(tr);
        });
}

window.deleteStudent = function(roll) {
    if (confirm(`Are you sure you want to remove Roll No: ${roll}?`)) {
        students = students.filter(s => s.roll !== roll);
        saveData();
        initApp();
        showToast("Student deleted successfully");
    }
};

function renderDefaulters() {
    defaultersTbody.innerHTML = "";
    const defaulters = students.filter(s => {
        const pct = s.totalClasses > 0 ? (s.attended / s.totalClasses) * 100 : 100;
        return pct < 75;
    });

    defaulters.forEach(student => {
        const pct = ((student.attended / student.totalClasses) * 100).toFixed(1);
        const shortage = (75 - pct).toFixed(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${student.roll}</b></td>
            <td>${student.name}</td>
            <td>${student.phone}</td>
            <td style="color:var(--danger);font-weight:700">${pct}%</td>
            <td>-${shortage}%</td>
            <td>
                <button class="btn-primary" onclick="sendAlert('${student.name}', '${student.phone}', '${pct}')">
                    <i class="fa-solid fa-paper-plane"></i> Send Parent Alert
                </button>
            </td>
        `;
        defaultersTbody.appendChild(tr);
    });
}

window.sendAlert = function(name, phone, pct) {
    showToast(`SMS Alert sent to ${name}'s parent (${phone}) regarding ${pct}% attendance!`);
};

function updateDashboardStats() {
    const key = getRecordKey();
    const todayRec = attendanceRecords[key] || {};

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    Object.values(todayRec).forEach(val => {
        if (val === "Present") presentCount++;
        if (val === "Absent") absentCount++;
        if (val === "Leave") leaveCount++;
    });

    const defaulterCount = students.filter(s => (s.attended / s.totalClasses) * 100 < 75).length;

    document.getElementById('stat-total').innerText = students.length;
    document.getElementById('stat-present').innerText = presentCount;
    document.getElementById('stat-absent').innerText = absentCount;
    document.getElementById('stat-defaulters').innerText = defaulterCount;

    renderCharts(presentCount, absentCount, leaveCount);
}

function renderCharts(present, absent, leave) {
    const unmarked = Math.max(0, students.length - (present + absent + leave));

    const ctx1 = document.getElementById('todayChart').getContext('2d');
    if (todayChartInstance) todayChartInstance.destroy();
    todayChartInstance = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Leave', 'Unmarked'],
            datasets: [{
                data: [present, absent, leave, unmarked],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#94a3b8'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx2 = document.getElementById('overallChart').getContext('2d');
    if (overallChartInstance) overallChartInstance.destroy();
    overallChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: students.map(s => s.name.split(' ')[0]),
            datasets: [{
                label: 'Attendance %',
                data: students.map(s => ((s.attended / s.totalClasses) * 100).toFixed(1)),
                backgroundColor: students.map(s => ((s.attended / s.totalClasses) * 100) < 75 ? '#ef4444' : '#4f46e5'),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function populateScannerDropdown() {
    scanSelect.innerHTML = "";
    students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.roll;
        opt.textContent = `${s.roll} - ${s.name}`;
        scanSelect.appendChild(opt);
    });
}

document.getElementById('trigger-scan-btn').addEventListener('click', () => {
    const selectedRoll = scanSelect.value;
    const student = students.find(s => s.roll === selectedRoll);
    if (!student) return;

    markStatus(selectedRoll, 'Present');
    document.getElementById('scan-status-text').innerText = `✅ Verified: ${student.name} (${student.roll})`;

    const logList = document.getElementById('scan-log-list');
    const emptyItem = logList.querySelector('.empty-log');
    if (emptyItem) emptyItem.remove();

    const li = document.createElement('li');
    li.innerHTML = `<span><b>${student.roll}</b> - ${student.name}</span> <span class="badge badge-present">${new Date().toLocaleTimeString()}</span>`;
    logList.prepend(li);
});

const modal = document.getElementById('student-modal');
document.getElementById('open-add-modal').addEventListener('click', () => modal.classList.add('show'));
document.querySelector('.close-modal').addEventListener('click', () => modal.classList.remove('show'));

document.getElementById('add-student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const roll = document.getElementById('stu-roll').value.trim();
    const name = document.getElementById('stu-name').value.trim();
    const branch = document.getElementById('stu-branch').value;
    const phone = document.getElementById('stu-phone').value.trim();

    if (students.some(s => s.roll.toLowerCase() === roll.toLowerCase())) {
        showToast("Roll Number already exists!");
        return;
    }

    students.push({ id: Date.now(), roll, name, branch, phone, totalClasses: 1, attended: 1 });
    saveData();
    initApp();
    modal.classList.remove('show');
    e.target.reset();
    showToast(`Added ${name} to directory!`);
});

document.getElementById('export-csv').addEventListener('click', () => {
    const key = getRecordKey();
    const currentRecord = attendanceRecords[key] || {};
    let csvContent = "data:text/csv;charset=utf-8,Roll No,Name,Branch,Total Attended,Total Classes,Overall %,Today Status\n";

    students.forEach(s => {
        const pct = ((s.attended / s.totalClasses) * 100).toFixed(1);
        const todayStatus = currentRecord[s.roll] || "Unmarked";
        csvContent += `${s.roll},"${s.name}",${s.branch},${s.attended},${s.totalClasses},${pct}%,${todayStatus}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${key}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("CSV Report Downloaded!");
});

document.querySelectorAll('.nav-links li').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        item.classList.add('active');
        const tabId = item.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        document.getElementById('page-title').innerText = item.innerText.trim();
    });
});

document.getElementById('search-attendance').addEventListener('input', (e) => renderAttendanceTable(e.target.value));
document.getElementById('search-student-dir').addEventListener('input', (e) => renderStudentsDirectory(e.target.value));
dateInput.addEventListener('change', initApp);
subjectSelect.addEventListener('change', initApp);

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

document.getElementById('reset-data').addEventListener('click', () => {
    if (confirm("Reset all attendance data to default demo values?")) {
        localStorage.removeItem('edutrack_students');
        localStorage.removeItem('edutrack_records');
        location.reload();
    }
});

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

initApp();
