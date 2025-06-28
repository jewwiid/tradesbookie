# OAuth Sign-In/Sign-Up Flow Separation Analysis

## Current Issues Identified

### 1. **No Clear UI Separation**
- Single "Sign In" button handles both login and registration
- Users cannot distinguish between existing account login vs new account creation
- No visual cues for different authentication flows

### 2. **Backend Flow Confusion**
- `upsertUser` function always creates accounts regardless of user intent
- No validation for existing users attempting to "sign up"
- No error handling for non-existent users attempting to "sign in"

### 3. **Mixed Authentication Methods**
- OAuth for customers/admins but traditional login for installers
- Inconsistent authentication patterns across user roles
- Confusing user experience with multiple login paths

### 4. **Session Management Issues**
- No differentiation between sign-in and sign-up in session data
- Role assignment happens during OAuth regardless of account existence
- Missing account verification flow for new registrations

## Implemented Solutions

### 1. **Separate API Endpoints**
- `/api/login` - For existing users to sign in
- `/api/signup` - For new users to register
- Different OAuth prompts: `login` vs `consent`

### 2. **Enhanced Session Tracking**
- `authAction` field to track login vs signup intent
- Proper validation in `upsertUser` function
- Error handling for mismatched flows

### 3. **Improved UI Components**
- Separate "Sign In" and "Sign Up" buttons in navigation
- Clear visual distinction between authentication actions
- Mobile-responsive authentication menu

### 4. **Account Flow Validation**
- Login attempts on non-existent accounts redirect to signup
- Signup attempts on existing accounts proceed with login
- Proper error messages for account status mismatches

## Benefits of This Approach

1. **User Clarity**: Clear separation of sign-in vs sign-up actions
2. **Better UX**: Appropriate error handling and redirects
3. **Security**: Prevents accidental account creation during login attempts
4. **Consistency**: Unified OAuth flow with proper intent tracking
5. **Scalability**: Framework supports future authentication enhancements

## Technical Implementation

- Enhanced `upsertUser` with `authAction` parameter
- Session-based intent tracking (`req.session.authAction`)
- UI components with separate authentication buttons
- Proper error handling for account existence validation