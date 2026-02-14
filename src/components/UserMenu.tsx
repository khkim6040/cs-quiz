'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

export default function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  const handleChangeName = () => {
    setIsDropdownOpen(false);
    setShowChangeNameModal(true);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
        >
          로그인
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  // 로그인 상태
  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-orange-500 transition-colors"
        >
          <span className="font-medium text-gray-800">{user.username}님</span>
          <svg
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <button
              onClick={handleChangeName}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span className="text-gray-700">이름 변경</span>
            </button>
            <hr className="my-2 border-gray-200" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </div>

      {/* 이름 변경 모달 */}
      <LoginModal
        isOpen={showChangeNameModal}
        onClose={() => setShowChangeNameModal(false)}
        message="새로운 닉네임을 입력해주세요"
        onSuccess={() => {
          // 이름 변경 성공 시 페이지 새로고침으로 상태 동기화
          window.location.reload();
        }}
      />
    </>
  );
}
