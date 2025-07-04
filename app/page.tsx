'use client'

import React from 'react';
import Link from 'next/link'

const StoreLayoutEditor = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 메인 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            식당 관리 시스템
          </h1>
          <p className="text-gray-600">
            원하는 메뉴를 선택하세요
          </p>
        </div>

        {/* 네비게이션 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          {/* POS 시스템 버튼 */}
          <Link href="/pos">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>POS 시스템</span>
            </button>
          </Link>

          {/* 웹소켓 테스트 버튼 */}
          <Link href="/websocket-test">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>웹소켓 테스트</span>
            </button>
          </Link>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>개발 모드에서 실행 중입니다</p>
        </div>
      </div>
    </div>
  );
};

export default StoreLayoutEditor;