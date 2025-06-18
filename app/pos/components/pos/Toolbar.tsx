// components/Toolbar.js
import React from 'react';
import { Trash2, RotateCcw, Save, Grid, Table, Move, Square, Plus } from 'lucide-react';

const Toolbar = ({
  mode,
  onModeChange,
  onAddTable,
  showGrid,
  onToggleGrid,
  onClearAll,
  onSaveLayout
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Table className="w-6 h-6" />
          Next.js + Konva.js 매장 레이아웃 에디터
        </h1>
        
        <div className="flex items-center gap-2">
          {/* 모드 선택 토글 버튼 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onModeChange('select')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
                mode === 'select' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Move className="w-4 h-4" />
              선택
            </button>
            <button
              onClick={() => onModeChange('draw')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
                mode === 'draw' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Square className="w-4 h-4" />
              그리기
            </button>
          </div>

          {/* 테이블 추가 버튼 */}
          <button
            onClick={onAddTable}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            테이블 추가
          </button>

          {/* 격자 표시/숨기기 토글 버튼 */}
          <button
            onClick={onToggleGrid}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Grid className="w-4 h-4" />
            격자
          </button>
          
          {/* 초기화 버튼 */}
          <button
            onClick={onClearAll}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>
          
          {/* 저장 버튼 */}
          <button
            onClick={onSaveLayout}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            저장
          </button>
        </div>
      </div>
      
      {/* 모드별 안내 메시지 및 단축키 */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm text-gray-600">
          {mode === 'draw' ? '캔버스에서 드래그하여 테이블을 그리세요.' : '테이블을 선택하고 드래그하여 이동하거나 크기를 조정하세요.'}
        </p>
        
        <div className="text-xs text-gray-500">
          단축키: Delete(삭제), Ctrl+D(복사), Esc(선택해제)
        </div>
      </div>
    </div>
  );
};

export default Toolbar;