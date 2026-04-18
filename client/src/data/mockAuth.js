// Mock auth functions for demo - bypass Supabase fetch errors
import { USERS, registerUser, authenticate } from './mockData.js';

export async function mockSignUp(email, password, options = {}) {
  // Check if user exists
  if (USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('already registered');
  }

  const newUser = registerUser(options.full_name || email.split('@')[0], email, options.phone, options.dob);
  return {
    user: { id: newUser.id, email, user_metadata: { full_name: newUser.name } },
    session: { access_token: 'mock-token-' + Date.now() }
  };
}

// eslint-disable-next-line no-unused-vars
export async function mockSignIn(roleId, email, password) {
  const user = authenticate(roleId, email);
  if (!user) {
    throw new Error('invalid login credentials');
  }
  return {
    user: { id: user.id, email: user.email, user_metadata: { full_name: user.name } },
    session: { access_token: 'mock-token-' + Date.now() }
  };
}

export async function mockGetProfile(id) {
  return USERS.find(u => u.id === id) || null;
}

export async function mockUpsertProfile(id, data) {
  const index = USERS.findIndex(u => u.id === id);
  if (index > -1) {
    USERS[index] = { ...USERS[index], ...data };
  } else {
    USERS.push({ id, ...data, role: 'patient', avatar: data.full_name?.charAt(0)?.toUpperCase() || 'U' });
  }
  return USERS.find(u => u.id === id);
}

// Export as drop-in replacement
export const signIn = mockSignIn;
export const signUp = mockSignUp;
export const getProfile = mockGetProfile;
export const upsertProfile = mockUpsertProfile;
// eslint-disable-next-line no-unused-vars
export const requestPasswordReset = async (email) => {}; // No-op
export const signOut = () => localStorage.removeItem('labintel_user');
