// Global variables
let currentUser = null;

// ============ INITIALIZATION ============
window.addEventListener('load', async () => {
    await initDB();
    await initializeDefaultData();
});

async function initializeDefaultData() {
    const users = await dbGetAll('users');
    if (users.length === 0) {
        // Add default users
        const defaultUsers = [
            { id: 'admin001', email: 'admin@school.edu', password: 'admin123', name: 'Administrator', role: 'admin', status: 'approved' },
            { id: 'teacher001', email: 'teacher1@school.edu', password: 'teacher123', name: 'Dr. Amit Kumar', role: 'teacher', identifier: 'EMP001', department: 'Computer Science', phone: '9876543220', status: 'approved' },
            { id: 'teacher002', email: 'teacher2@school.edu', password: 'teacher123', name: 'Ms. Priya Sharma', role: 'teacher', identifier: 'EMP002', department: 'CS', phone: '9876543221', status: 'approved' },
            { id: 'student001', email: 'student1@school.edu', password: 'student123', name: 'Prashant Rashankar', role: 'student', identifier: 'CS252029', branch: 'Computer Science', year: '2nd Year', phone: '9876543210', status: 'approved' },
            { id: 'student002', email: 'student2@school.edu', password: 'student123', name: 'Aniket Patel', role: 'student', identifier: 'CS252030', branch: 'CS', year: '2nd Year', phone: '9876543211', status: 'approved' }
        ];
        for (let user of defaultUsers) {
            await dbAdd('users', user);
        }

        // Add default subjects
        const defaultSubjects = [
            { id: 'subj001', code: 'CS201', name: 'Data Structures', semester: '3rd', department: 'CS', credits: 4 },
            { id: 'subj002', code: 'CS202', name: 'Database', semester: '4th', department: 'CS', credits: 4 },
            { id: 'subj003', code: 'CS203', name: 'Web Development', semester: '4th', department: 'CS', credits: 3 },
            { id: 'subj004', code: 'CS204', name: 'Algorithms', semester: '3rd', department: 'CS', credits: 4 }
        ];
        for (let subject of defaultSubjects) {
            await dbAdd('subjects', subject);
        }

        // Add default classes
        const defaultClasses = [
            { id: 'class001', subject_id: 'subj001', teacher_id: 'teacher001', schedule: 'MWF 10:00 AM', room: 'Lab-101', capacity: 50, enrolled_students: 45 },
            { id: 'class002', subject_id: 'subj002', teacher_id: 'teacher002', schedule: 'TTh 2:00 PM', room: 'Lab-102', capacity: 50, enrolled_students: 48 }
        ];
        for (let cls of defaultClasses) {
            await dbAdd('classes', cls);
        }
    }
}

// ============ AUTHENTICATION ============
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    const users = await dbGetAll('users');
    const user = users.find(u => (u.email === email || u.identifier === email) && u.password === password);

    if (!user) {
        alert('Invalid credentials');
        return;
    }

    if (user.status !== 'approved') {
        alert('Your account is pending approval');
        return;
    }

    currentUser = user;
    showDashboard();
}

// ============ REGISTRATION - FULLY WORKING ============
function selectRole(role) {
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
    event.target.closest('.role-option').classList.add('selected');

    if (role === 'student') {
        document.getElementById('studentFields').style.display = 'block';
        document.getElementById('teacherFields').style.display = 'none';
    } else {
        document.getElementById('studentFields').style.display = 'none';
        document.getElementById('teacherFields').style.display = 'block';
    }
}

async function handleRegister() {
    console.log('Register button clicked');

    const role = document.querySelector('input[name="role"]:checked').value;
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    console.log('Role:', role, 'Name:', name, 'Email:', email);

    let errors = [];

    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!email.includes('@')) errors.push('Valid email required');
    if (!phone) errors.push('Phone is required');
    if (phone.length !== 10) errors.push('Phone must be 10 digits');
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    if (password !== confirmPassword) errors.push('Passwords do not match');

    if (role === 'student') {
        const roll = document.getElementById('regRoll').value.trim();
        const branch = document.getElementById('regBranch').value;
        const year = document.getElementById('regYear').value;
        if (!roll) errors.push('Roll number is required');
        if (!branch) errors.push('Branch is required');
        if (!year) errors.push('Year is required');
    } else {
        const empId = document.getElementById('regEmpId').value.trim();
        const dept = document.getElementById('regDept').value;
        const subjects = document.querySelectorAll('input[name="subjects"]:checked');
        if (!empId) errors.push('Employee ID is required');
        if (!dept) errors.push('Department is required');
        if (subjects.length === 0) errors.push('Select at least 1 subject');
    }

    if (errors.length > 0) {
        alert('Errors:\n' + errors.join('\n'));
        return;
    }

    // Check if email already exists
    const users = await dbGetAll('users');
    if (users.some(u => u.email === email)) {
        alert('Email already registered');
        return;
    }

    // Save registration as pending
    const registration = {
        id: 'pending_' + Date.now(),
        role, name, email, phone, password,
        status: 'pending',
        timestamp: new Date().toLocaleString()
    };

    if (role === 'student') {
        registration.identifier = document.getElementById('regRoll').value.trim();
        registration.branch = document.getElementById('regBranch').value;
        registration.year = document.getElementById('regYear').value;
    } else {
        registration.identifier = document.getElementById('regEmpId').value.trim();
        registration.department = document.getElementById('regDept').value;
        registration.subjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);
        registration.qualifications = document.getElementById('regQualifications').value.trim();
    }

    try {
        await dbAdd('pending_registrations', registration);
        console.log('Registration saved:', registration);
        alert('✓ Registration successful! Pending admin approval.\n\nYour application will be reviewed shortly.');
        goToLogin();
    } catch (error) {
        console.error('Error saving registration:', error);
        alert('Error saving registration: ' + error);
    }
}

function goToLogin() {
    showPage('loginPage');
    document.getElementById('registerForm').reset();
}

function goToRegister() {
    showPage('registerPage');
    document.getElementById('loginForm').reset();
}

// ============ UI NAVIGATION ============
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboardArea').style.display = 'flex';

    document.getElementById('userDisplay').textContent = currentUser.name + ' (' + currentUser.role + ')';
    buildSidebar();

    if (currentUser.role === 'admin') {
        loadAdminDashboard();
        loadSubjects();
        loadTeachers();
        loadStudents();
        loadClasses();
        loadAttendance();
        loadResults();
        loadPendingApprovals();
        showPage('adminDashboard');
    } else if (currentUser.role === 'teacher') {
        loadTeacherClasses();
        showPage('teacherClassesPage');
    } else {
        loadStudentAttendance();
        loadStudentResults();
        showPage('studentAttendancePage');
    }

    loadProfile();
}

function handleLogout() {
    currentUser = null;
    document.getElementById('dashboardArea').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function buildSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = '';

    let items = [];
    if (currentUser.role === 'admin') {
        items = [
            { id: 'adminDashboard', label: 'Dashboard' },
            { id: 'subjectsPage', label: 'Subjects' },
            { id: 'classesPage', label: 'Classes' },
            { id: 'teachersPage', label: 'Teachers' },
            { id: 'studentsPage', label: 'Students' },
            { id: 'attendancePage', label: 'Attendance' },
            { id: 'resultsPage', label: 'Results' },
            { id: 'approvalsPage', label: 'Approvals' },
            { id: 'profilePage', label: 'Profile' },
            { id: 'aboutPage', label: 'About' }
        ];
    } else if (currentUser.role === 'teacher') {
        items = [
            { id: 'teacherClassesPage', label: 'My Classes' },
            { id: 'profilePage', label: 'Profile' },
            { id: 'aboutPage', label: 'About' }
        ];
    } else {
        items = [
            { id: 'studentAttendancePage', label: 'Attendance' },
            { id: 'studentResultsPage', label: 'Results' },
            { id: 'profilePage', label: 'Profile' },
            { id: 'aboutPage', label: 'About' }
        ];
    }

    items.forEach((item, idx) => {
        const nav = document.createElement('div');
        nav.className = 'nav-item' + (idx === 0 ? ' active' : '');
        nav.textContent = item.label;
        nav.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
            showPage(item.id);
        };
        menu.appendChild(nav);
    });
}

// ============ ADMIN FUNCTIONS ============
async function loadAdminDashboard() {
    const users = await dbGetAll('users');
    const subjects = await dbGetAll('subjects');
    const classes = await dbGetAll('classes');
    const pending = (await dbGetAll('pending_registrations')).filter(r => r.status === 'pending');

    const stats = `
        <div class="stat-card"><h3>${users.filter(u => u.role === 'student').length}</h3><p>Students</p></div>
        <div class="stat-card"><h3>${users.filter(u => u.role === 'teacher').length}</h3><p>Teachers</p></div>
        <div class="stat-card"><h3>${subjects.length}</h3><p>Subjects</p></div>
        <div class="stat-card"><h3>${classes.length}</h3><p>Classes</p></div>
        <div class="stat-card"><h3>${pending.length}</h3><p>Pending Approvals</p></div>
    `;
    document.getElementById('statsContainer').innerHTML = stats;

    const actions = `
        <button class="btn" onclick="showPage('subjectsPage')" style="width: auto;">Subjects</button>
        <button class="btn" onclick="showPage('classesPage')" style="width: auto;">Classes</button>
        <button class="btn" onclick="showPage('approvalsPage')" style="width: auto;">Approvals</button>
    `;
    document.getElementById('quickActionsContainer').innerHTML = actions;
}

// ============ SUBJECT MANAGEMENT ============
async function openAddSubjectModal() {
    document.getElementById('subjectModalTitle').textContent = 'Add Subject';
    document.getElementById('subjectForm').reset();
    document.getElementById('subjectForm').dataset.editId = '';
    openModal('subjectModal');
}

async function handleSaveSubject() {
    const code = document.getElementById('subjectCode').value.trim();
    const name = document.getElementById('subjectName').value.trim();
    const semester = document.getElementById('subjectSemester').value;
    const department = document.getElementById('subjectDept').value;
    const credits = document.getElementById('subjectCredits').value;

    if (!code || !name || !semester || !department || !credits) {
        alert('All fields are required');
        return;
    }

    const subject = {
        id: 'subj_' + Date.now(),
        code, name, semester, department, credits: parseInt(credits),
        description: document.getElementById('subjectDescription').value
    };

    await dbAdd('subjects', subject);
    closeModal('subjectModal');
    loadSubjects();
    alert('Subject added successfully!');
}

async function loadSubjects() {
    const subjects = await dbGetAll('subjects');
    const tbody = document.getElementById('subjectsTableBody');
    tbody.innerHTML = '';

    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject.code}</td>
            <td>${subject.name}</td>
            <td>${subject.semester}</td>
            <td>${subject.department}</td>
            <td>${subject.credits}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-delete" onclick="deleteSubject('${subject.id}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Fill subject selects
    [document.getElementById('classSubject'), document.getElementById('resultSubject')].forEach(select => {
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">Select Subject</option>';
        subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            select.appendChild(opt);
        });
        select.value = current;
    });
}

async function deleteSubject(id) {
    if (!confirm('Delete this subject?')) return;
    await dbDelete('subjects', id);
    loadSubjects();
    alert('Subject deleted!');
}

// ============ CLASS MANAGEMENT ============
async function openAddClassModal() {
    const teachers = await dbGetAll('users');
    const teacherSelect = document.getElementById('classTeacher');
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.filter(u => u.role === 'teacher').forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        teacherSelect.appendChild(opt);
    });
    openModal('classModal');
}

async function handleSaveClass() {
    const subjectId = document.getElementById('classSubject').value;
    const teacherId = document.getElementById('classTeacher').value;
    const schedule = document.getElementById('classSchedule').value.trim();
    const room = document.getElementById('classRoom').value.trim();
    const capacity = document.getElementById('classCapacity').value;

    if (!subjectId || !teacherId || !schedule || !room || !capacity) {
        alert('All fields required');
        return;
    }

    const cls = {
        id: 'class_' + Date.now(),
        subject_id: subjectId, teacher_id: teacherId, schedule, room,
        capacity: parseInt(capacity), enrolled_students: 0
    };

    await dbAdd('classes', cls);
    closeModal('classModal');
    loadClasses();
    alert('Class added!');
}

async function loadClasses() {
    const classes = await dbGetAll('classes');
    const subjects = await dbGetAll('subjects');
    const users = await dbGetAll('users');

    const tbody = document.getElementById('classesTableBody');
    tbody.innerHTML = '';

    classes.forEach(cls => {
        const subject = subjects.find(s => s.id === cls.subject_id);
        const teacher = users.find(u => u.id === cls.teacher_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject?.name || 'N/A'}</td>
            <td>${teacher?.name || 'N/A'}</td>
            <td>${cls.schedule}</td>
            <td>${cls.room}</td>
            <td>${cls.capacity}</td>
            <td><button class="btn-small btn-delete" onclick="deleteClass('${cls.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });

    // Fill class selects
    const classSelect = document.getElementById('attendanceClass');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">Select Class</option>';
        classes.forEach(cls => {
            const subject = subjects.find(s => s.id === cls.subject_id);
            const opt = document.createElement('option');
            opt.value = cls.id;
            opt.textContent = (subject?.name || 'Unknown') + ' - ' + cls.schedule;
            classSelect.appendChild(opt);
        });
    }
}

async function deleteClass(id) {
    if (!confirm('Delete this class?')) return;
    await dbDelete('classes', id);
    loadClasses();
}

// ============ TEACHERS ============
async function loadTeachers() {
    const users = await dbGetAll('users');
    const teachers = users.filter(u => u.role === 'teacher');

    const tbody = document.getElementById('teachersTableBody');
    tbody.innerHTML = '';
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.identifier}</td>
            <td>${teacher.department || 'N/A'}</td>
            <td><button class="btn-small btn-delete" onclick="removeUser('${teacher.id}')">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ============ STUDENTS ============
async function loadStudents() {
    const users = await dbGetAll('users');
    const students = users.filter(u => u.role === 'student');

    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.identifier}</td>
            <td>${student.branch || 'N/A'}</td>
            <td>${student.year || 'N/A'}</td>
            <td><button class="btn-small btn-delete" onclick="removeUser('${student.id}')">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function removeUser(id) {
    if (!confirm('Remove this user?')) return;
    await dbDelete('users', id);
    loadTeachers();
    loadStudents();
}

// ============ ATTENDANCE ============
async function openMarkAttendanceModal() {
    const classes = await dbGetAll('classes');
    const classSelect = document.getElementById('attendanceClass');
    classSelect.innerHTML = '<option value="">Select Class</option>';
    classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls.id;
        opt.textContent = cls.schedule;
        classSelect.appendChild(opt);
    });
    openModal('attendanceModal');
}

async function loadStudentsForAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    if (!classId) return;

    const users = await dbGetAll('users');
    const students = users.filter(u => u.role === 'student');

    const container = document.getElementById('studentAttendanceList');
    container.innerHTML = '';
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" name="student_${student.id}" value="${student.id}">
            <label>${student.name}</label>
        `;
        container.appendChild(div);
    });
}

async function handleMarkAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    const students = document.querySelectorAll('#studentAttendanceList input[type="checkbox"]:checked');

    if (!classId || !date) {
        alert('Select class and date');
        return;
    }

    students.forEach(async student => {
        const attendance = {
            id: 'att_' + Date.now() + Math.random(),
            student_id: student.value,
            class_id: classId,
            date, status: 'present'
        };
        await dbAdd('attendance', attendance);
    });

    closeModal('attendanceModal');
    loadAttendance();
    alert('Attendance marked!');
}

async function loadAttendance() {
    const attendance = await dbGetAll('attendance');
    const users = await dbGetAll('users');
    const classes = await dbGetAll('classes');
    const subjects = await dbGetAll('subjects');

    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    attendance.forEach(att => {
        const student = users.find(u => u.id === att.student_id);
        const cls = classes.find(c => c.id === att.class_id);
        const subject = cls ? subjects.find(s => s.id === cls.subject_id) : null;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student?.name || 'N/A'}</td>
            <td>${subject?.name || 'N/A'}</td>
            <td>${att.date}</td>
            <td><span style="background: #27ae60; color: white; padding: 3px 8px; border-radius: 3px;">Present</span></td>
            <td><button class="btn-small btn-delete" onclick="deleteAtt('${att.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteAtt(id) {
    if (!confirm('Delete?')) return;
    await dbDelete('attendance', id);
    loadAttendance();
}

// ============ RESULTS ============
async function openAddResultModal() {
    const users = await dbGetAll('users');
    const studentSelect = document.getElementById('resultStudent');
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    users.filter(u => u.role === 'student').forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        studentSelect.appendChild(opt);
    });
    openModal('resultModal');
}

async function handleSaveResult() {
    const studentId = document.getElementById('resultStudent').value;
    const subjectId = document.getElementById('resultSubject').value;
    const marks = document.getElementById('resultMarks').value;
    const total = document.getElementById('resultTotal').value;
    const grade = document.getElementById('resultGrade').value;

    if (!studentId || !subjectId || !marks || !total) {
        alert('All fields required');
        return;
    }

    const result = {
        id: 'res_' + Date.now(),
        student_id: studentId, subject_id: subjectId,
        marks: parseInt(marks), total: parseInt(total), grade
    };

    await dbAdd('results', result);
    closeModal('resultModal');
    loadResults();
    alert('Result added!');
}

async function loadResults() {
    const results = await dbGetAll('results');
    const users = await dbGetAll('users');
    const subjects = await dbGetAll('subjects');

    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';

    results.forEach(result => {
        const student = users.find(u => u.id === result.student_id);
        const subject = subjects.find(s => s.id === result.subject_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student?.name || 'N/A'}</td>
            <td>${subject?.name || 'N/A'}</td>
            <td>${result.marks}</td>
            <td>${result.total}</td>
            <td>${result.grade}</td>
            <td><button class="btn-small btn-delete" onclick="deleteResult('${result.id}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteResult(id) {
    if (!confirm('Delete?')) return;
    await dbDelete('results', id);
    loadResults();
}

// ============ APPROVALS ============
async function loadPendingApprovals() {
    const pending = await dbGetAll('pending_registrations');
    const container = document.getElementById('pendingApprovalsContainer');
    container.innerHTML = '';

    const pendingList = pending.filter(r => r.status === 'pending');
    if (pendingList.length === 0) {
        container.innerHTML = '<p style="text-align: center;">No pending approvals</p>';
        return;
    }

    pendingList.forEach(req => {
        container.innerHTML += `
            <div style="background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <p><strong>${req.name}</strong> (${req.identifier}) - ${req.role}</p>
                <p>Email: ${req.email}</p>
                <p>Phone: ${req.phone}</p>
                ${req.branch ? `<p>Branch: ${req.branch}</p>` : ''}
                ${req.department ? `<p>Department: ${req.department}</p>` : ''}
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn" style="width: auto; background: #27ae60;" onclick="approveReg('${req.id}', '${req.role}')">Approve</button>
                    <button class="btn" style="width: auto; background: #e74c3c;" onclick="rejectReg('${req.id}')">Reject</button>
                </div>
            </div>
        `;
    });
}

async function approveReg(regId, role) {
    const reg = await dbGet('pending_registrations', regId);
    if (!reg) return;

    const user = {
        id: 'user_' + regId,
        email: reg.email,
        identifier: reg.identifier,
        password: reg.password,
        name: reg.name,
        phone: reg.phone,
        role: role,
        status: 'approved'
    };

    if (role === 'student') {
        user.branch = reg.branch;
        user.year = reg.year;
    } else {
        user.department = reg.department;
        user.subjects = reg.subjects;
    }

    await dbAdd('users', user);
    await dbUpdate('pending_registrations', { ...reg, status: 'approved' });
    loadPendingApprovals();
    alert('User approved!');
}

async function rejectReg(regId) {
    if (!confirm('Reject this registration?')) return;
    const reg = await dbGet('pending_registrations', regId);
    await dbUpdate('pending_registrations', { ...reg, status: 'rejected' });
    loadPendingApprovals();
    alert('Registration rejected!');
}

// ============ STUDENT FUNCTIONS ============
async function loadStudentAttendance() {
    if (!currentUser) return;

    const attendance = await dbGetAll('attendance');
    const classes = await dbGetAll('classes');
    const subjects = await dbGetAll('subjects');

    const studentAtt = attendance.filter(a => a.student_id === currentUser.id);
    const container = document.getElementById('studentAttendanceContainer');

    if (studentAtt.length === 0) {
        container.innerHTML = '<p>No attendance records</p>';
        return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>Percentage</th></tr></thead><tbody>';
    const bySubject = {};
    studentAtt.forEach(att => {
        const cls = classes.find(c => c.id === att.class_id);
        const subject = cls ? subjects.find(s => s.id === cls.subject_id) : null;
        if (subject) {
            if (!bySubject[subject.id]) {
                bySubject[subject.id] = { subject, present: 0, total: 0 };
            }
            bySubject[subject.id].total++;
            if (att.status === 'present') bySubject[subject.id].present++;
        }
    });

    Object.values(bySubject).forEach(data => {
        const pct = ((data.present / data.total) * 100).toFixed(1);
        html += `<tr><td>${data.subject.name}</td><td>${data.present}</td><td>${data.total}</td><td>${pct}%</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function loadStudentResults() {
    if (!currentUser) return;

    const results = await dbGetAll('results');
    const subjects = await dbGetAll('subjects');
    const studentResults = results.filter(r => r.student_id === currentUser.id);

    const tbody = document.getElementById('studentResultsTableBody');
    tbody.innerHTML = '';

    studentResults.forEach(result => {
        const subject = subjects.find(s => s.id === result.subject_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject?.name || 'N/A'}</td>
            <td>${result.marks}</td>
            <td>${result.total}</td>
            <td>${result.grade}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ TEACHER FUNCTIONS ============
async function loadTeacherClasses() {
    if (!currentUser) return;

    const classes = await dbGetAll('classes');
    const subjects = await dbGetAll('subjects');
    const teacherClasses = classes.filter(c => c.teacher_id === currentUser.id);

    const tbody = document.getElementById('teacherClassesTableBody');
    tbody.innerHTML = '';

    teacherClasses.forEach(cls => {
        const subject = subjects.find(s => s.id === cls.subject_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject?.name || 'N/A'}</td>
            <td>${cls.schedule}</td>
            <td>${cls.room}</td>
            <td>${cls.enrolled_students}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ PROFILE ============
async function loadProfile() {
    const container = document.getElementById('profileContent');
    container.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>${currentUser.role === 'student' ? 'Roll Number' : 'Employee ID'}:</strong> ${currentUser.identifier}</p>
        <p><strong>Phone:</strong> ${currentUser.phone}</p>
        ${currentUser.branch ? `<p><strong>Branch:</strong> ${currentUser.branch}</p>` : ''}
        ${currentUser.year ? `<p><strong>Year:</strong> ${currentUser.year}</p>` : ''}
        ${currentUser.department ? `<p><strong>Department:</strong> ${currentUser.department}</p>` : ''}
    `;
}

// ============ MODALS ============
function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// Add click outside modal to close
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
