 
import React from 'react';
import { Copy, Trash2 } from 'lucide-react';

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 10;

const Sidebar = ({
  tables,
  selectedId,
  selectedTable,
  mode,
  onSelectTable,
  onUpdateTableName,
  onDuplicateTable,
  onDeleteTable
}) => {
  return (
    <div className="w-80 bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">테이블 관리</h2>
      
      {selectedTable && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-3">선택된 테이블</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="tableNameInput" className="block text-sm font-medium text-gray-700 mb-1">
                테이블 이름
              </label>
              <input
                id="tableNameInput"
                type="text"
                value={selectedTable.name}
                onChange={(e) => onUpdateTableName(selectedTable.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">위치:</span>
                <div className="font-mono">({selectedTable.x}, {selectedTable.y})</div>
              </div>
              <div>
                <span className="text-gray-500">크기:</span>
                <div className="font-mono">{selectedTable.width}×{selectedTable.height}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onDuplicateTable(selectedTable.id)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                복사
              </button>
              <button
                onClick={() => onDeleteTable(selectedTable.id)}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="font-medium text-gray-700 mb-3">전체 테이블 목록</h3>
      
      {tables.length === 0 ? (
        <p className="text-gray-500 text-sm">
          아직 테이블이 없습니다.<br />
          그리기 모드에서 드래그하여 테이블을 만들거나 "테이블 추가" 버튼을 클릭하세요.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tables.map(table => (
            <div
              key={table.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedId === table.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectTable(table.id)}
            >
              <div className="font-medium text-sm">{table.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                ({table.x}, {table.y}) | {table.width}×{table.height}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 통계 및 도움말 */}
      <div className="mt-6 pt-4 border-t space-y-4">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">통계</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>총 테이블: {tables.length}개</div>
            <div>현재 모드: <span className="font-semibold">{mode === 'draw' ? '그리기' : '선택'}</span></div>
            <div>캔버스 크기: {STAGE_WIDTH}×{STAGE_HEIGHT}</div>
            <div>격자 크기: {GRID_SIZE}px</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Next.js + Konva.js 특징</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• SSR 호환 동적 로딩</div>
            <div>• 부드러운 드래그 & 드롭</div>
            <div>• 실시간 크기 조정</div>
            <div>• 고성능 2D 렌더링</div>
            <div>• 터치 및 마우스 이벤트 지원</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;