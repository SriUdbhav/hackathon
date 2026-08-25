/* =====================================================
   PROFILE.JS
   User Profile Page — Beautiful, informational dashboard
   for Admin, Faculty, Mentor, and Student roles.
   Available under Management > My Profile
===================================================== */

async function renderProfile() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
        const role = (user.role || "faculty").toLowerCase();
        const userId = user.id;

        // Show loading state
        content.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border" role="status" style="color: var(--accent);"></div>
                <p class="mt-3" style="color: var(--text-muted);">Loading profile...</p>
            </div>
        `;

        // Fetch full profile from backend
        const res = await API.getProfile(userId);
        const profile = res?.profile || {
            id: user.id,
            display_name: user.display_name || user.id,
            role: user.role,
            email: user.email || null,
            phone: user.phone || null,
            subjects: user.subjects || "",
            extra_roles: user.extra_roles || "",
        };
        const sd = profile.student_data || null;

    // Avatar: first letter of display name
    const displayName = profile.display_name || profile.id || "User";
    const avatarLetter = displayName.charAt(0).toUpperCase();

    // Role config
    const roleConfig = {
        admin:   { label: "System Administrator", icon: "bi-shield-check",    gradient: "linear-gradient(135deg, #f38ba8 0%, #eba0ac 100%)", accentColor: "#f38ba8" },
        faculty: { label: "Faculty Member",       icon: "bi-journal-bookmark", gradient: "linear-gradient(135deg, #b4befe 0%, #89b4fa 100%)", accentColor: "#b4befe" },
        mentor:  { label: "Academic Mentor",      icon: "bi-person-check",    gradient: "linear-gradient(135deg, #89dceb 0%, #94e2d5 100%)", accentColor: "#89dceb" },
        student: { label: "Student",              icon: "bi-mortarboard",     gradient: "linear-gradient(135deg, #a6e3a1 0%, #94e2d5 100%)", accentColor: "#a6e3a1" },
    };
    const rc = roleConfig[role] || roleConfig.faculty;

    // Subject & role badges
    const subjects = (profile.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
    const extraRoles = (profile.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);

    content.innerHTML = `
        <!-- PROFILE HERO BANNER -->
        <div class="profile-hero" style="
            background: ${rc.gradient};
            border-radius: var(--radius-lg, 16px);
            padding: 40px 36px 32px;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        ">
            <div style="position: absolute; top: -60px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>
            <div style="position: absolute; bottom: -30px; left: 50%; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.06);"></div>
            <div class="d-flex align-items-center gap-4 flex-wrap" style="position: relative; z-index: 1;">
                <!-- Avatar Circle -->
                <div style="
                    width: 96px; height: 96px; border-radius: 50%;
                    background: rgba(30, 30, 46, 0.65);
                    backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 40px; font-weight: 800; color: #fff;
                    border: 3px solid rgba(255,255,255,0.3);
                    flex-shrink: 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">${avatarLetter}</div>
                <div style="flex: 1; min-width: 200px;">
                    <h2 style="color: #1e1e2e; font-weight: 800; font-size: 26px; margin-bottom: 4px;">${displayName}</h2>
                    <div style="color: rgba(30,30,46,0.7); font-size: 14px; font-weight: 500; margin-bottom: 10px;">
                        <i class="bi ${rc.icon} me-1"></i> ${rc.label} &middot; <code style="color: rgba(30,30,46,0.6); font-size: 12px;">${profile.id}</code>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        ${subjects.map(s => `<span style="background: rgba(30,30,46,0.15); color: #1e1e2e; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${s}</span>`).join("")}
                        ${extraRoles.map(r => `<span style="background: rgba(255,255,255,0.3); color: #1e1e2e; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${r}</span>`).join("")}
                    </div>
                </div>
                <div class="d-flex flex-column gap-2" style="min-width: 160px;">
                    <button class="btn btn-sm" onclick="openChangePasswordModal(event)" style="background: rgba(30,30,46,0.2); color: #1e1e2e; border: 1px solid rgba(30,30,46,0.15); font-weight: 600; padding: 8px 16px; border-radius: 10px;">
                        <i class="bi bi-key-fill me-1"></i> Change Password
                    </button>
                    <button class="btn btn-sm" onclick="navigateTo('settings')" style="background: rgba(30,30,46,0.1); color: #1e1e2e; border: 1px solid rgba(30,30,46,0.1); font-weight: 600; padding: 8px 16px; border-radius: 10px;">
                        <i class="bi bi-gear me-1"></i> Settings
                    </button>
                </div>
            </div>
        </div>

        <!-- CONTENT GRID -->
        <div class="row g-4">
            <!-- Contact Card -->
            <div class="${role === 'student' && sd ? 'col-lg-4' : 'col-lg-6'}">
                <div class="card-box p-4 h-100">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-person-lines-fill" style="color: var(--accent); font-size: 16px;"></i>
                        </div>
                        <h6 class="fw-bold mb-0" style="color: var(--text);">Contact Information</h6>
                    </div>
                    <div class="d-flex flex-column gap-3">
                        ${_profileInfoRow("bi-envelope-at", "Email", profile.email || sd?.email || "Not provided")}
                        ${_profileInfoRow("bi-telephone-forward", "Phone", profile.phone || sd?.phone || "Not provided")}
                        ${sd ? _profileInfoRow("bi-geo-alt-fill", "Location", [sd.place, sd.region, sd.country].filter(Boolean).join(", ") || "N/A") : ""}
                        ${sd ? _profileInfoRow("bi-translate", "Mother Tongue", sd.mother_tongue || "N/A") : ""}
                        ${_profileInfoRow("bi-fingerprint", "User ID", profile.id)}
                    </div>
                </div>
            </div>

            ${role === "student" && sd ? _profileStudentStatsCard(sd) : ""}

            ${role === "student" && sd ? _profileAcademicCard(sd) : ""}

            ${(role === "faculty" || role === "mentor") ? _profileStaffDetailCard(profile, role, rc) : ""}

            ${role === "admin" ? _profileAdminDetailCard(profile, rc) : ""}

            ${role === "student" && sd ? _profileFamilyCard(sd) : ""}
        </div>
    `;
    } catch (err) {
        console.error("[Profile Render Error]:", err);
        content.innerHTML = `
            <div class="card-box p-4 text-center my-4">
                <i class="bi bi-exclamation-triangle text-warning fs-1 mb-2"></i>
                <h4 class="fw-bold">Unable to display profile</h4>
                <p class="text-muted">${err?.message || "Unknown error loading profile data."}</p>
                <button class="primary-btn mt-2" onclick="renderProfile()"><i class="bi bi-arrow-clockwise"></i> Try Again</button>
            </div>
        `;
    }
}


// ---- Info row (label-value pair) ----
function _profileInfoRow(icon, label, value) {
    return `
        <div class="d-flex align-items-center gap-3 py-2" style="border-bottom: 1px solid var(--border-soft);">
            <i class="bi ${icon}" style="color: var(--accent); font-size: 16px; width: 20px; text-align: center;"></i>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                <div style="color: var(--text); font-weight: 500; word-break: break-word;">${value}</div>
            </div>
        </div>
    `;
}


// ---- Student: stats ring card ----
function _profileStudentStatsCard(sd) {
    const attd = sd.attendance ?? 0;
    const cgpa = sd.cgpa ?? 0;
    const lms = sd.lms_score ?? 0;
    const risk = sd.risk ?? 0;

    const attdColor = attd < 75 ? "var(--risk-high)" : "var(--success)";
    const cgpaColor = cgpa < 7.0 ? "var(--risk-medium)" : "var(--success)";
    const riskColor = risk >= 60 ? "var(--risk-high)" : (risk >= 30 ? "var(--risk-medium)" : "var(--risk-low)");
    const riskLabel = risk >= 60 ? "High Risk" : (risk >= 30 ? "Moderate" : "Low Risk");

    return `
        <div class="col-lg-8">
            <div class="card-box p-4 h-100">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--risk-low-soft); display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-graph-up-arrow" style="color: var(--success); font-size: 16px;"></i>
                    </div>
                    <h6 class="fw-bold mb-0" style="color: var(--text);">Academic Overview</h6>
                </div>
                <div class="row g-3">
                    ${_profileStatBlock("Attendance", `${attd}%`, attdColor, attd)}
                    ${_profileStatBlock("CGPA", `${cgpa}`, cgpaColor, (cgpa / 10) * 100)}
                    ${_profileStatBlock("LMS Score", `${lms}%`, "var(--accent)", lms)}
                    ${_profileStatBlock("Risk Level", `${risk}%`, riskColor, risk, riskLabel)}
                    ${_profileStatBlock("Credits", `${sd.credits ?? 0}`, "var(--text)", null)}
                    ${_profileStatBlock("Year", `${sd.year || "N/A"}`, "var(--info)", null)}
                </div>
            </div>
        </div>
    `;
}

function _profileStatBlock(label, value, color, percent, sublabel) {
    const barHtml = percent != null ? `
        <div style="width: 100%; height: 4px; background: var(--bg-sunken); border-radius: 2px; margin-top: 8px; overflow: hidden;">
            <div style="width: ${Math.min(percent, 100)}%; height: 100%; background: ${color}; border-radius: 2px; transition: width 0.6s ease;"></div>
        </div>
    ` : "";
    return `
        <div class="col-6 col-md-4">
            <div style="padding: 16px; background: var(--bg-sunken); border-radius: var(--radius); border: 1px solid var(--border-soft); text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${label}</div>
                <div style="font-size: 24px; font-weight: 800; color: ${color};">${value}</div>
                ${sublabel ? `<div style="font-size: 11px; color: ${color}; font-weight: 600; margin-top: 2px;">${sublabel}</div>` : ""}
                ${barHtml}
            </div>
        </div>
    `;
}


// ---- Student: academic details card ----
function _profileAcademicCard(sd) {
    return `
        <div class="col-lg-6">
            <div class="card-box p-4 h-100">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(137, 180, 250, 0.15); display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-book-half" style="color: var(--accent); font-size: 16px;"></i>
                    </div>
                    <h6 class="fw-bold mb-0" style="color: var(--text);">Academic Details</h6>
                </div>
                <div class="d-flex flex-column gap-3">
                    ${_profileInfoRow("bi-journal-text", "Course / Program", sd.course || "N/A")}
                    ${_profileInfoRow("bi-calendar-event", "Current Year", sd.year || "N/A")}
                    ${_profileInfoRow("bi-gender-ambiguous", "Gender", sd.gender || "N/A")}
                    ${_profileInfoRow("bi-person-vcard", "Student ID", sd.id || "N/A")}
                </div>
            </div>
        </div>
    `;
}


// ---- Student: family card ----
function _profileFamilyCard(sd) {
    return `
        <div class="col-lg-6">
            <div class="card-box p-4 h-100">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(249, 226, 175, 0.15); display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-house-heart" style="color: var(--warning); font-size: 16px;"></i>
                    </div>
                    <h6 class="fw-bold mb-0" style="color: var(--text);">Family Information</h6>
                </div>
                <div class="d-flex flex-column gap-3">
                    ${_profileInfoRow("bi-person", "Father's Name", sd.father || "N/A")}
                    ${_profileInfoRow("bi-person-heart", "Mother's Name", sd.mother || "N/A")}
                </div>
            </div>
        </div>
    `;
}


// ---- Faculty/Mentor detail card ----
function _profileStaffDetailCard(profile, role, rc) {
    const subjects = (profile.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
    const roles = (profile.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);
    const iconClass = role === "mentor" ? "bi-people-fill" : "bi-journal-bookmark-fill";

    return `
        <div class="col-lg-6">
            <div class="card-box p-4 h-100">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center;">
                        <i class="bi ${iconClass}" style="color: var(--accent); font-size: 16px;"></i>
                    </div>
                    <h6 class="fw-bold mb-0" style="color: var(--text);">${role === "mentor" ? "Mentoring" : "Teaching"} Profile</h6>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Assigned Subjects</div>
                    <div class="d-flex flex-wrap gap-2">
                        ${subjects.length > 0 ? subjects.map(s => `
                            <span style="background: var(--accent-soft); color: var(--accent); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                <i class="bi bi-book me-1"></i>${s}
                            </span>
                        `).join("") : '<span style="color: var(--text-muted); font-size: 13px;">No subjects assigned</span>'}
                    </div>
                </div>

                <div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Responsibilities & Roles</div>
                    <div class="d-flex flex-wrap gap-2">
                        ${roles.length > 0 ? roles.map(r => `
                            <span style="background: var(--risk-medium-soft); color: var(--warning); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                <i class="bi bi-award me-1"></i>${r}
                            </span>
                        `).join("") : '<span style="color: var(--text-muted); font-size: 13px;">No extra roles</span>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}


// ---- Admin detail card ----
function _profileAdminDetailCard(profile, rc) {
    const roles = (profile.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);
    return `
        <div class="col-lg-6">
            <div class="card-box p-4 h-100">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--risk-high-soft); display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-shield-lock-fill" style="color: var(--risk-high); font-size: 16px;"></i>
                    </div>
                    <h6 class="fw-bold mb-0" style="color: var(--text);">Administrator Access</h6>
                </div>

                <div style="background: var(--bg-sunken); border-radius: var(--radius); padding: 16px; border: 1px solid var(--border-soft); margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Access Level</div>
                    <div class="d-flex align-items-center gap-2">
                        <span style="background: var(--risk-high-soft); color: var(--risk-high); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700;">
                            <i class="bi bi-shield-fill-check me-1"></i> Full System Administrator
                        </span>
                    </div>
                </div>

                <div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Roles & Responsibilities</div>
                    <div class="d-flex flex-wrap gap-2">
                        ${roles.length > 0 ? roles.map(r => `
                            <span style="background: var(--risk-medium-soft); color: var(--warning); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                <i class="bi bi-award me-1"></i>${r}
                            </span>
                        `).join("") : '<span style="color: var(--text-muted); font-size: 13px;">Super Admin — Full Access</span>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}
