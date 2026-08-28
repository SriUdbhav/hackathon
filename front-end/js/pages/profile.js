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

    // Role config with semantic theme variables
    const roleConfig = {
        admin:   { label: "System Administrator", icon: "bi-shield-check",    accentColor: "#ef4444", roleSoft: "var(--risk-high-soft)", badgeBg: "rgba(239, 68, 68, 0.15)", badgeColor: "#ef4444" },
        faculty: { label: "Faculty Member",       icon: "bi-journal-bookmark", accentColor: "#3b82f6", roleSoft: "var(--accent-soft)", badgeBg: "rgba(59, 130, 246, 0.15)", badgeColor: "#3b82f6" },
        mentor:  { label: "Academic Mentor",      icon: "bi-person-check",    accentColor: "#06b6d4", roleSoft: "var(--accent-soft)", badgeBg: "rgba(6, 182, 212, 0.15)", badgeColor: "#06b6d4" },
        student: { label: "Student",              icon: "bi-mortarboard",     accentColor: "#10b981", roleSoft: "var(--risk-low-soft)", badgeBg: "rgba(16, 185, 129, 0.15)", badgeColor: "#10b981" },
    };
    const rc = roleConfig[role] || roleConfig.faculty;

    // Subject & role badges
    const subjects = (profile.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
    const extraRoles = (profile.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);

    content.innerHTML = `
        <!-- PROFILE HERO BANNER (THEME-ADAPTIVE) -->
        <div class="profile-hero mb-4" style="
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-left: 6px solid ${rc.accentColor};
            border-radius: var(--radius-lg, 16px);
            padding: 32px 30px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        ">
            <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; border-radius: 50%; background: ${rc.accentColor}; opacity: 0.05; pointer-events: none;"></div>
            <div class="d-flex align-items-center gap-4 flex-wrap" style="position: relative; z-index: 1;">
                <!-- Avatar Circle -->
                <div style="
                    width: 88px; height: 88px; border-radius: 50%;
                    background: ${rc.accentColor};
                    display: flex; align-items: center; justify-content: center;
                    font-size: 36px; font-weight: 800; color: #ffffff;
                    box-shadow: 0 6px 16px ${rc.accentColor}40;
                    flex-shrink: 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">${avatarLetter}</div>
                <div style="flex: 1; min-width: 220px;">
                    <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <h2 style="color: var(--text); font-weight: 800; font-size: 26px; margin-bottom: 0;">${displayName}</h2>
                        <span class="badge" style="background: ${rc.badgeBg}; color: ${rc.badgeColor}; font-size: 12px; font-weight: 700; border: 1px solid ${rc.badgeColor}40;">
                            <i class="bi ${rc.icon} me-1"></i> ${rc.label}
                        </span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-3" style="color: var(--text-muted); font-size: 13.5px; font-weight: 500;">
                        <span>Account ID:</span>
                        <code style="background: var(--bg-sunken); color: var(--accent); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border-soft); font-size: 12.5px; font-weight: 600;">${profile.id}</code>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        ${subjects.map(s => `<span style="background: var(--bg-sunken); color: var(--text-soft); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid var(--border-soft);"><i class="bi bi-book text-primary me-1"></i>${s}</span>`).join("")}
                        ${extraRoles.map(r => `<span style="background: var(--bg-sunken); color: var(--text-soft); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid var(--border-soft);"><i class="bi bi-award text-warning me-1"></i>${r}</span>`).join("")}
                    </div>
                </div>
                <div class="d-flex flex-column gap-2" style="min-width: 170px;">
                    <button class="secondary-btn btn-sm d-flex align-items-center justify-content-center gap-2" onclick="openChangePasswordModal(event)" style="font-weight: 600; padding: 9px 16px;">
                        <i class="bi bi-key-fill text-primary"></i> Change Password
                    </button>
                    <button class="primary-btn btn-sm d-flex align-items-center justify-content-center gap-2" onclick="navigateTo('settings')" style="font-weight: 600; padding: 9px 16px;">
                        <i class="bi bi-gear-fill"></i> System Settings
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

// Window Exports for Profile Page
window.renderProfile = renderProfile;
