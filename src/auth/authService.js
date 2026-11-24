// src/auth/authService.js
const USERS_KEY = "rively_demo_users";
const SESSION_KEY = "rively_current_user";

export function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function hashPassword(pw) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(pw));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser({ name, email, phone, password }) {
  const users = loadUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error("Email already registered");
  }
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const newUser = {
    name,
    email,
    phone: phone || "",
    passwordHash,
    createdAt: now,
  };
  users.push(newUser);
  saveUsers(users);
  const session = { name, email, phone: newUser.phone, createdAt: now };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function loginUser({ email, password }) {
  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");
  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) throw new Error("Invalid credentials");
  const session = {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    createdAt: user.createdAt || null,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getFullCurrentUser() {
  const session = getCurrentUser();
  if (!session) return null;
  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
  if (user) {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone || session.phone || "",
      createdAt: user.createdAt || session.createdAt || null,
    };
  }
  return session;
}

export async function updateUserProfile(currentEmail, { name, email, phone }) {
  const users = loadUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());
  if (index === -1) {
    throw new Error("User account not found");
  }

  const newEmail = (email || currentEmail).trim();
  // Check if new email is taken by another account
  if (newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
    const isTaken = users.some((u, i) => i !== index && u.email.toLowerCase() === newEmail.toLowerCase());
    if (isTaken) {
      throw new Error("This email is already registered to another account");
    }
  }

  const updatedUser = {
    ...users[index],
    name: (name || users[index].name).trim(),
    email: newEmail,
    phone: phone !== undefined ? phone.trim() : (users[index].phone || ""),
  };

  users[index] = updatedUser;
  saveUsers(users);

  // Update current session
  const session = {
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    createdAt: updatedUser.createdAt || null,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // If email changed, also update userEmail on existing bookings so Ride History is preserved!
  if (newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
    try {
      const bookingsRaw = localStorage.getItem("rident_bookings");
      if (bookingsRaw) {
        const bookings = JSON.parse(bookingsRaw);
        let modified = false;
        bookings.forEach((b) => {
          if (b.userEmail && b.userEmail.toLowerCase() === currentEmail.toLowerCase()) {
            b.userEmail = newEmail;
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem("rident_bookings", JSON.stringify(bookings));
        }
      }
    } catch (e) {
      console.error("Error migrating bookings to new email:", e);
    }
  }

  return session;
}

export async function changeUserPassword(email, currentPassword, newPassword) {
  const users = loadUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) throw new Error("User account not found");

  const currentHash = await hashPassword(currentPassword);
  if (users[index].passwordHash !== currentHash) {
    throw new Error("Current password does not match");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  const newHash = await hashPassword(newPassword);
  users[index].passwordHash = newHash;
  saveUsers(users);
  return true;
}
