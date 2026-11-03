let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentAdmin = checkAuth('admin');
  if (!currentAdmin) return;
  document.getElementById('userName').textContent = currentAdmin.name;
  await loadStats();
  await loadUsers();
  await loadInternships();
  await loadApplications();
});

async function loadStats() {
  const r = await apiCall('/admin/stats', 'GET', null, true);
  if (!r.ok) return;
  const s = r.data;
  document.getElementById('totalUsers').textContent = s.totalUsers;
  document.getElementById('totalStudents').textContent = s.totalStudents;
  document.getElementById('totalRecruiters').textContent = s.totalRecruiters;
  document.getElementById('totalInternshipsAdmin').textContent = s.totalInternships;
  document.getElementById('totalApplicationsAdmin').textContent = s.totalApplications;
  document.getElementById('pendingApplications').textContent = s.pendingApplications;
}

async function loadUsers() {
  const c = document.getElementById('usersList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/admin/users', 'GET', null, true);
  if (!r.ok) return;
  c.innerHTML = r.data.users.map(u => `
    <div class="internship-card">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5>${u.name}</h5>
          <p class="company">${u.email}</p>
          <span class="badge bg-${u.role === 'student' ? 'info' : u.role === 'recruiter' ? 'primary' : 'dark'}">${u.role.toUpperCase()}</span>
        </div>
        ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}')">🗑️ Delete</button>` : ''}
      </div>
    </div>`).join('');
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  const r = await apiCall(`/admin/users/${id}`, 'DELETE', null, true);
  if (r.ok) { showToast('User deleted', 'success'); await loadUsers(); await loadStats(); }
  else showToast(r.data.message || 'Failed', 'error');
}

async function loadInternships() {
  const c = document.getElementById('internshipsAdminList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/admin/internships', 'GET', null, true);
  if (!r.ok) return;
  c.innerHTML = r.data.internships.map(i => `
    <div class="internship-card">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5>${i.title}</h5>
          <p class="company">${i.company} • ${i.location}</p>
          <small class="text-muted">By: ${i.recruiter?.name || 'N/A'} (${i.recruiter?.email || 'N/A'})</small>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteInternship('${i._id}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

async function deleteInternship(id) {
  if (!confirm('Delete this internship?')) return;
  const r = await apiCall(`/admin/internships/${id}`, 'DELETE', null, true);
  if (r.ok) { showToast('Internship deleted', 'success'); await loadInternships(); await loadStats(); }
  else showToast(r.data.message || 'Failed', 'error');
}

async function loadApplications() {
  const c = document.getElementById('appsAdminList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/admin/applications', 'GET', null, true);
  if (!r.ok) return;
  c.innerHTML = r.data.applications.map(a => `
    <div class="internship-card">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5>${a.student?.name || 'N/A'}</h5>
          <p class="company">${a.student?.email || 'N/A'}</p>
          <p class="details">Applied to: ${a.internship?.title || 'N/A'} at ${a.internship?.company || 'N/A'}</p>
        </div>
        <span class="badge bg-${getStatusColor(a.status)}">${a.status.toUpperCase()}</span>
      </div>
    </div>`).join('');
}