'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import SignUpModal from './SignUpModal';

export default function AuthModals() {
  const { isSignUpOpen, closeSignUp, isLoginOpen, closeLogin, openSignUp } = useAuth();

  return (
    <>
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={closeSignUp}
        onSwitchToLogin={() => {
          closeSignUp();
        }}
      />

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={closeLogin}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold z-10"
            >
              ✕
            </button>
            <LoginForm
              onSuccess={closeLogin}
              onSwitchToSignUp={openSignUp}
            />
          </div>
        </div>
      )}
    </>
  );
}