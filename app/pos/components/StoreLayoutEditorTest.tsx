'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Group } from 'react-konva';
import { Trash2, RotateCcw, Save, Grid, Table, Move, Square, Plus, Copy } from 'lucide-react';

// Next.js에서 Konva 사용 시 필요한 설정
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 20;

// 테이블 컴포넌트
const TableShape = ({ 
  table, 
  isSelected, 
  onSelect, 
  onChange,
  onDelete 
}) => {
  const groupRef = useRef();
  const shapeRef = useRef();
  const textRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      // Transformer를 그룹 전체에 연결
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, table.width, table.height]); // table.width, table.height 의존성 추가

  const handleTransformEnd = () => {
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 새로운 크기 계산
    const newWidth = Math.max(GRID_SIZE, Math.round((table.width * scaleX) / GRID_SIZE) * GRID_SIZE);
    const newHeight = Math.max(GRID_SIZE, Math.round((table.height * scaleY) / GRID_SIZE) * GRID_SIZE);
    const newX = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;

    // 스케일 리셋
    node.scaleX(1);
    node.scaleY(1);
    
    // 내부 Rect와 Text 크기 업데이트
    if (shapeRef.current) {
      shapeRef.current.width(newWidth);
      shapeRef.current.height(newHeight);
    }
    if (textRef.current) {
      textRef.current.width(newWidth);
      textRef.current.height(newHeight);
    }

    // Transformer 강제 업데이트
    if (trRef.current) {
      trRef.current.forceUpdate();
      trRef.current.getLayer().batchDraw();
    }

    const newAttrs = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };

    onChange({
      ...table,
      ...newAttrs,
    });
  };

  const handleDragEnd = (e) => {
    const newAttrs = {
      x: Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE,
      y: Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE,
    };

    onChange({
      ...table,
      ...newAttrs,
    });
  };

  return (
    <Group>
      <Group
        ref={groupRef}
        x={table.x}
        y={table.y}
        draggable
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={() => onSelect(table.id)}
        onTap={() => onSelect(table.id)}
      >
        <Rect
          ref={shapeRef}
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          fill={isSelected ? '#3b82f6' : '#f59e0b'}
          stroke={isSelected ? '#1d4ed8' : '#d97706'}
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          ref={textRef}
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          text={table.name}
          fontSize={12}
          fontFamily="Arial"
          fill="white"
          align="center"
          verticalAlign="middle"
          listening={false} // 텍스트는 클릭 이벤트 무시
        />
      </Group>
      {isSelected && (
        <Transformer
          rotateEnabled={false} 
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 최소 크기 제한
            if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'bottom-right',
            'bottom-center',
            'bottom-left',
            'middle-left',
          ]}
        />
      )}
    </Group>
  );
};

// 격자 배경 컴포넌트
const GridBackground = ({ visible }) => {
  if (!visible) return null;

  const lines = [];
  
  // 세로 선
  for (let i = 0; i <= STAGE_WIDTH / GRID_SIZE; i++) {
    lines.push(
      <line
        key={`v${i}`}
        x1={i * GRID_SIZE}
        y1={0}
        x2={i * GRID_SIZE}
        y2={STAGE_HEIGHT}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }
  
  // 가로 선
  for (let i = 0; i <= STAGE_HEIGHT / GRID_SIZE; i++) {
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={i * GRID_SIZE}
        x2={STAGE_WIDTH}
        y2={i * GRID_SIZE}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        pointerEvents: 'none',
      }}
    >
      {lines}
    </svg>
  );
};

const StoreLayoutEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTable, setDrawingTable] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'draw'
  const stageRef = useRef();

  // 테이블 추가
  const addTable = useCallback((x = 100, y = 100) => {
    const newTable = {
      id: Date.now().toString(),
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      width: GRID_SIZE * 4,
      height: GRID_SIZE * 2,
      name: `테이블 ${tables.length + 1}`,
    };
    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id);
  }, [tables.length]);

  // 테이블 선택
  const selectTable = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 테이블 업데이트
  const updateTable = useCallback((updatedTable) => {
    setTables(prev =>
      prev.map(table =>
        table.id === updatedTable.id ? updatedTable : table
      )
    );
  }, []);

  // 테이블 삭제
  const deleteTable = useCallback((id) => {
    setTables(prev => prev.filter(table => table.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // 테이블 복사
  const duplicateTable = useCallback((id) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      const newTable = {
        ...table,
        id: Date.now().toString(),
        x: table.x + 20,
        y: table.y + 20,
        name: `${table.name} 복사`,
      };
      setTables(prev => [...prev, newTable]);
      setSelectedId(newTable.id);
    }
  }, [tables]);

  // 격자에 맞춰 좌표 정렬
  const snapToGrid = (x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  });

  // 마우스 다운 (드래그 시작)
  const handleStageMouseDown = useCallback((e) => {
    // 빈 공간 클릭 시에만 처리
    if (e.target !== e.target.getStage()) return;
    
    const pos = e.target.getPointerPosition();
    const snappedPos = snapToGrid(pos.x, pos.y);
    
    if (mode === 'draw') {
      setIsDrawing(true);
      setStartPos(snappedPos);
      setSelectedId(null);
      
      // 임시 테이블 생성
      const tempTable = {
        id: 'temp-' + Date.now(),
        x: snappedPos.x,
        y: snappedPos.y,
        width: GRID_SIZE,
        height: GRID_SIZE,
        name: `테이블 ${tables.length + 1}`,
      };
      setDrawingTable(tempTable);
    } else {
      setSelectedId(null);
    }
  }, [mode, tables.length]);

  // 마우스 이동 (드래그 중)
  const handleStageMouseMove = useCallback((e) => {
    if (!isDrawing || !startPos) return;
    
    const pos = e.target.getPointerPosition();
    const snappedPos = snapToGrid(pos.x, pos.y);
    
    // 드래그 영역 계산
    const width = Math.abs(snappedPos.x - startPos.x) + GRID_SIZE;
    const height = Math.abs(snappedPos.y - startPos.y) + GRID_SIZE;
    const x = Math.min(startPos.x, snappedPos.x);
    const y = Math.min(startPos.y, snappedPos.y);
    
    setDrawingTable(prev => ({
      ...prev,
      x,
      y,
      width,
      height,
    }));
  }, [isDrawing, startPos]);

  // 마우스 업 (드래그 완료)
  const handleStageMouseUp = useCallback(() => {
    if (isDrawing && drawingTable) {
      // 최소 크기 확인
      if (drawingTable.width >= GRID_SIZE && drawingTable.height >= GRID_SIZE) {
        const newTable = {
          ...drawingTable,
          id: Date.now().toString(),
        };
        setTables(prev => [...prev, newTable]);
        setSelectedId(newTable.id);
      }
    }
    
    setIsDrawing(false);
    setDrawingTable(null);
    setStartPos(null);
  }, [isDrawing, drawingTable]);

  // 스테이지 클릭 (선택 해제용)
  const handleStageClick = useCallback((e) => {
    // 빈 공간 클릭 시에만 선택 해제
    if (e.target === e.target.getStage() && mode === 'select') {
      setSelectedId(null);
    }
  }, [mode]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Delete' && selectedId) {
        deleteTable(selectedId);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
      if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateTable(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, deleteTable, duplicateTable]);

  // 테이블 이름 변경
  const updateTableName = useCallback((id, newName) => {
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, name: newName } : table
      )
    );
  }, []);

  // 모든 테이블 삭제
  const clearAll = useCallback(() => {
    setTables([]);
    setSelectedId(null);
  }, []);

  // 레이아웃 저장
  const saveLayout = useCallback(() => {
    const layoutData = {
      tables,
      timestamp: new Date().toISOString(),
      canvasSize: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
    };
    
    // 실제로는 API 호출 또는 로컬스토리지 저장
    console.log('매장 레이아웃 저장:', layoutData);
    
    // Next.js에서는 다음과 같이 사용할 수 있습니다:
    // await fetch('/api/save-layout', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(layoutData)
    // });
    
    alert('레이아웃이 저장되었습니다!');
  }, [tables]);

  // 선택된 테이블 정보
  const selectedTable = tables.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      {/* 상단 툴바 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Table className="w-6 h-6" />
            Konva.js 매장 레이아웃 에디터
          </h1>
          
          <div className="flex items-center gap-2">
            {/* 모드 선택 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('select')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
                  mode === 'select' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Move className="w-4 h-4" />
                선택
              </button>
              <button
                onClick={() => setMode('draw')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
                  mode === 'draw' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Square className="w-4 h-4" />
                그리기
              </button>
            </div>

            <button
              onClick={() => addTable()}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              테이블 추가
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              격자
            </button>
            
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            
            <button
              onClick={saveLayout}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-600">
            {mode === 'draw' && '캔버스에서 드래그하여 테이블을 그리세요.'}
            {mode === 'select' && '테이블을 선택하고 드래그하여 이동하거나 크기를 조정하세요.'}
          </p>
          
          <div className="text-xs text-gray-500">
            단축키: Delete(삭제), Ctrl+D(복사), Esc(선택해제)
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        {/* 캔버스 영역 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <GridBackground visible={showGrid} />
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onClick={handleStageClick}
              onTouchStart={handleStageMouseDown}
              onTouchMove={handleStageMouseMove}
              onTouchEnd={handleStageMouseUp}
            >
              <Layer>
                {tables.map(table => (
                  <TableShape
                    key={table.id}
                    table={table}
                    isSelected={table.id === selectedId}
                    onSelect={selectTable}
                    onChange={updateTable}
                    onDelete={deleteTable}
                  />
                ))}
                
                {/* 드래그 중인 임시 테이블 */}
                {drawingTable && (
                  <Group>
                    <Rect
                      {...drawingTable}
                      fill="#10b981"
                      stroke="#059669"
                      strokeWidth={2}
                      dash={[5, 5]}
                      cornerRadius={4}
                      opacity={0.7}
                      listening={false}
                    />
                    <Text
                      x={drawingTable.x}
                      y={drawingTable.y}
                      width={drawingTable.width}
                      height={drawingTable.height}
                      text={drawingTable.name}
                      fontSize={12}
                      fontFamily="Arial"
                      fill="white"
                      align="center"
                      verticalAlign="middle"
                      listening={false}
                    />
                  </Group>
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="w-80 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">테이블 관리</h2>
          
          {selectedTable && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-3">선택된 테이블</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    테이블 이름
                  </label>
                  <input
                    type="text"
                    value={selectedTable.name}
                    onChange={(e) => updateTableName(selectedTable.id, e.target.value)}
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
                    onClick={() => duplicateTable(selectedTable.id)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    복사
                  </button>
                  <button
                    onClick={() => deleteTable(selectedTable.id)}
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
                  onClick={() => setSelectedId(table.id)}
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
                <div>현재 모드: {mode === 'draw' ? '그리기' : '선택'}</div>
                <div>캔버스: {STAGE_WIDTH}×{STAGE_HEIGHT}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Konva.js 특징</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 부드러운 드래그 & 드롭</div>
                <div>• 실시간 크기 조정</div>
                <div>• 고성능 렌더링</div>
                <div>• 터치 디바이스 지원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLayoutEditor;