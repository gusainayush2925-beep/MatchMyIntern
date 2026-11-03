let currentRecruiter = null;

document.addEventListener('DOMContentLoaded', () => {
  currentRecruiter = checkAuth('recruiter');
  if (!currentRecruiter) return;
  document.getElementById('userName').textContent = currentRecruiter.name;
  loadMyInternships();
  loadApplicants();
});

// ===== Load Recruiter's Internships =====
async function loadMyInternships() {
  const c = document.getElementById('myInternshipsList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/internships', 'GET');
  if (!r.ok) return;

  const mine = r.data.internships.filter(i => i.recruiter?._id === currentRecruiter.id);
  document.getElementById('totalPosts').textContent = mine.length;

  if (!mine.length) {
    c.innerHTML = '<div class="empty-state"><h4>📋 No Internships Posted</h4><p>Post your first internship!</p></div>';
    return;
  }

  c.innerHTML = mine.map(i => `
    <div class="internship-card">
      <h5>${escapeHtml(i.title)}</h5>
      <p class="company">${escapeHtml(i.company)}</p>
      <p class="details">📍 ${escapeHtml(i.location)} • 💰 ${escapeHtml(i.stipend || 'N/A')} • ⏱️ ${escapeHtml(i.duration || 'N/A')}</p>
      <p>${escapeHtml(i.description)}</p>
      <div class="mb-2">${i.skillsRequired.map(s => `<span class="skill-badge">${escapeHtml(s)}</span>`).join('')}</div>
      <small class="text-muted">Posted ${formatDate(i.createdAt)}</small>
      <div class="mt-3">
        <button class="btn btn-danger btn-sm" onclick="deleteMyInternship('${i._id}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

// ===== Delete Internship =====
async function deleteMyInternship(id) {
  if (!confirm('Delete this internship? All its applications will also be deleted.')) return;
  const r = await apiCall(`/internships/${id}`, 'DELETE', null, true);
  if (r.ok) {
    showToast('Internship deleted ✅', 'success');
    await loadMyInternships();
    await loadApplicants();
  } else showToast(r.data.message || 'Failed to delete', 'error');
}

// ===== Load Applicants (with Resume Fix) =====
async function loadApplicants() {
  const c = document.getElementById('applicantsList');
  c.innerHTML = '<div class="skeleton"></div>';
  const r = await apiCall('/applications/recruiter/all', 'GET', null, true);
  if (!r.ok) { c.innerHTML = '<p class="text-center text-muted">Failed to load.</p>'; return; }
  const apps = r.data.applications;
  document.getElementById('totalApplicants').textContent = apps.length;

  if (!apps.length) {
    c.innerHTML = '<div class="empty-state"><h4>👥 No Applicants Yet</h4><p>Students will appear here when they apply.</p></div>';
    return;
  }

  c.innerHTML = apps.map(a => `
    <div class="internship-card">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <h5>👤 ${escapeHtml(a.student?.name || 'N/A')}</h5>
          <p class="company">📧 ${escapeHtml(a.student?.email || 'N/A')}</p>
          <p class="details">Applied for: <strong>${escapeHtml(a.internship?.title || 'N/A')}</strong> at ${escapeHtml(a.internship?.company || 'N/A')}</p>
          <div class="mb-2">${(a.student?.skills || []).map(s => `<span class="skill-badge">${escapeHtml(s)}</span>`).join('')}</div>
          ${a.coverLetter ? `<p class="mt-2"><strong>Cover Letter:</strong> ${escapeHtml(a.coverLetter)}</p>` : ''}
        </div>
        <span class="badge bg-${getStatusColor(a.status)}">${escapeHtml(a.status.toUpperCase())}</span>
      </div>
      <div class="mt-3">
        ${a.resume
          ? `<a href="http://localhost:5000/${a.resume}" target="_blank" class="btn btn-outline-primary btn-sm me-2">📄 View Resume</a>`
          : `<button class="btn btn-secondary btn-sm me-2" disabled title="Old application without resume">📄 No Resume</button>`
        }
        ${['pending', 'reviewed'].includes(a.status) ? `
          <button class="btn btn-success btn-sm me-2" onclick="updateStatus('${a._id}', 'accepted')">✅ Accept</button>
          <button class="btn btn-danger btn-sm" onclick="updateStatus('${a._id}', 'rejected')">❌ Reject</button>
        ` : ''}
      </div>
    </div>`).join('');
}

// ===== Update Application Status =====
async function updateStatus(id, status) {
  if (!confirm(`Are you sure you want to ${status} this application?`)) return;
  const r = await apiCall(`/applications/${id}/status`, 'PUT', { status }, true);
  if (r.ok) {
    showToast(`Application ${status}!`, 'success');
    await loadApplicants();
  } else showToast(r.data.message || 'Failed', 'error');
}

// ===== Post Internship (Fixed - No Server Error) =====
async function postInternship() {
  const title = document.getElementById('title').value.trim();
  const company = document.getElementById('company').value.trim();
  const description = document.getElementById('description').value.trim();
  const location = document.getElementById('location').value.trim();
  const stipend = document.getElementById('stipend').value.trim();
  const duration = document.getElementById('duration').value.trim();
  const openings = document.getElementById('openings').value;
  const deadline = document.getElementById('deadline').value;
  const skillsRequired = document.getElementById('skillsRequired').value
    .split(',').map(s => s.trim()).filter(s => s);

  if (!title || !company || !description || !location || !skillsRequired.length) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  // ✅ FIX: Empty fields ko skip karo
  const payload = { title, company, description, location, skillsRequired };
  if (stipend) payload.stipend = stipend;
  if (duration) payload.duration = duration;
  if (openings) payload.openings = parseInt(openings);
  if (deadline) payload.deadline = deadline;

  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Posting...';

  const r = await apiCall('/internships', 'POST', payload, true);

  btn.disabled = false;
  btn.textContent = 'Post Internship';

  if (r.ok) {
    showToast('Internship posted! ✅', 'success');
    bootstrap.Modal.getInstance(document.getElementById('postInternshipModal')).hide();
    document.getElementById('postInternshipForm').reset();
    await loadMyInternships();
  } else {
    showToast(r.data.message || 'Failed to post', 'error');
    console.error('Post Internship Error:', r.data);
  }
}