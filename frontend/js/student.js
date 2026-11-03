let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = checkAuth('student');
  if (!currentUser) return;
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('firstName').textContent = currentUser.name.split(' ')[0];
  await loadDashboard();
});

async function loadDashboard() {
  await Promise.all([loadRecommendations(), loadAllInternships(), loadMyApplications()]);
}

async function loadRecommendations() {
  const c = document.getElementById('recommendationsList');
  c.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  const r = await apiCall('/recommendations', 'GET', null, true);
  if (!r.ok) { c.innerHTML = '<p class="text-center text-muted">Unable to load.</p>'; return; }
  const { recommendations, studentSkills } = r.data;

  if (!studentSkills || studentSkills.length === 0) {
    c.innerHTML = `<div class="empty-state"><h4>🎯 Add Your Skills First!</h4><p>Update your skills to get personalized recommendations.</p><button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#skillsModal">Add Skills</button></div>`;
    return;
  }

  document.getElementById('topMatches').textContent = recommendations.filter(x => x.matchScore > 0).length;
  if (!recommendations.length) { c.innerHTML = '<div class="empty-state"><h4>No internships yet</h4></div>'; return; }
  c.innerHTML = recommendations.map(i => renderInternshipCard(i, true)).join('');
}

async function loadAllInternships() {
  const c = document.getElementById('allInternshipsList');
  c.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  const r = await apiCall('/internships', 'GET');
  if (!r.ok) { c.innerHTML = '<p class="text-center text-muted">Failed to load.</p>'; return; }
  const list = r.data.internships;
  document.getElementById('totalInternships').textContent = list.length;
  if (!list.length) { c.innerHTML = '<div class="empty-state"><h4>No internships yet</h4></div>'; return; }
  c.innerHTML = list.map(i => renderInternshipCard(i, false)).join('');
}

// ✅ FIX: Special characters safe
function renderInternshipCard(i, showMatch) {
  const safeTitle = escapeHtml(i.title).replace(/'/g, "\\'");
  return `<div class="internship-card">
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <h5>${escapeHtml(i.title)}</h5>
        <p class="company mb-0">${escapeHtml(i.company)}</p>
      </div>
      ${showMatch ? `<span class="match-score">${i.matchScore}% Match</span>` : ''}
    </div>
    <p class="details">📍 ${escapeHtml(i.location)} • 💰 ${escapeHtml(i.stipend || 'Not specified')} • ⏱️ ${escapeHtml(i.duration || 'N/A')}</p>
    <p>${escapeHtml(i.description)}</p>
    <div class="mb-3">${i.skillsRequired.map(s => `<span class="skill-badge">${escapeHtml(s)}</span>`).join('')}</div>
    <button class="btn btn-primary btn-sm" onclick="openApplyModal('${i._id}', '${safeTitle}')">Apply Now</button>
  </div>`;
}

async function loadMyApplications() {
  const c = document.getElementById('applicationsList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/applications/my', 'GET', null, true);
  if (!r.ok) { c.innerHTML = '<p class="text-center text-muted">Unable to load.</p>'; return; }
  const apps = r.data.applications;
  document.getElementById('totalApplications').textContent = apps.length;
  if (!apps.length) { c.innerHTML = '<div class="empty-state"><h4>📩 No Applications Yet</h4><p>Start applying to internships!</p></div>'; return; }
  c.innerHTML = apps.map(a => `
    <div class="internship-card">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h5>${escapeHtml(a.internship?.title || 'N/A')}</h5>
          <p class="company">${escapeHtml(a.internship?.company || 'N/A')}</p>
          <p class="details">📍 ${escapeHtml(a.internship?.location || 'N/A')} • 💰 ${escapeHtml(a.internship?.stipend || 'N/A')}</p>
          <small class="text-muted">Applied on ${formatDate(a.createdAt)}</small>
        </div>
        <span class="badge bg-${getStatusColor(a.status)}">${escapeHtml(a.status.toUpperCase())}</span>
      </div>
    </div>`).join('');
}

function openApplyModal(id, title) {
  document.getElementById('applyInternshipId').value = id;
  document.getElementById('applyInternshipTitle').textContent = title;
  new bootstrap.Modal(document.getElementById('applyModal')).show();
}

async function submitApplication() {
  const id = document.getElementById('applyInternshipId').value;
  const file = document.getElementById('resumeFile').files[0];
  const cover = document.getElementById('coverLetter').value;
  if (!file) { showToast('Please upload your resume', 'error'); return; }

  const fd = new FormData();
  fd.append('resume', file);
  fd.append('coverLetter', cover);

  const btn = document.getElementById('submitApplicationBtn');
  btn.disabled = true; btn.textContent = 'Submitting...';

  const r = await apiCall(`/applications/apply/${id}`, 'POST', fd, true, true);

  if (r.ok) {
    showToast('Applied successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
    document.getElementById('resumeFile').value = '';
    document.getElementById('coverLetter').value = '';
    await loadMyApplications();
  } else {
    showToast(r.data.message || 'Failed to apply', 'error');
  }
  btn.disabled = false; btn.textContent = 'Submit Application';
}

async function updateSkills() {
  const val = document.getElementById('skillsInput').value;
  const skills = val.split(',').map(s => s.trim()).filter(s => s);
  if (!skills.length) { showToast('Enter at least one skill', 'error'); return; }
  const r = await apiCall('/users/profile', 'PUT', { skills }, true);
  if (r.ok) {
    showToast('Skills updated!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('skillsModal')).hide();
    await loadRecommendations();
  } else { showToast(r.data.message || 'Failed', 'error'); }
}

async function updateProfile() {
  const phone = document.getElementById('profilePhone').value;
  const bio = document.getElementById('profileBio').value;
  const degree = document.getElementById('eduDegree').value;
  const college = document.getElementById('eduCollege').value;
  const year = document.getElementById('eduYear').value;

  const payload = { phone, bio };
  if (degree || college || year) {
    payload.education = [{ degree, college, year, cgpa: '' }];
  }

  const r = await apiCall('/users/profile', 'PUT', payload, true);
  if (r.ok) {
    showToast('Profile updated!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
  } else { showToast(r.data.message || 'Failed', 'error'); }
}

// ✅ FIX: Loading spinner added
async function searchInternships() {
  const s = document.getElementById('searchInput').value;
  const l = document.getElementById('locationFilter').value;
  const k = document.getElementById('skillsFilter').value;
  const p = new URLSearchParams();
  if (s) p.append('search', s);
  if (l) p.append('location', l);
  if (k) p.append('skills', k);

  const btn = event.target;
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  const c = document.getElementById('allInternshipsList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall(`/internships?${p}`, 'GET');

  btn.disabled = false;
  btn.textContent = oldText;

  if (!r.ok) { c.innerHTML = '<p class="text-center text-muted">Search failed.</p>'; return; }
  const list = r.data.internships;
  if (!list.length) { c.innerHTML = '<div class="empty-state"><h4>No results found</h4></div>'; return; }
  c.innerHTML = list.map(i => renderInternshipCard(i, false)).join('');
}