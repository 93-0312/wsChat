'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 컴포넌트들을 동적으로 import (react-konva 사용 컴포넌트만)
const KonvaCanvas = dynamic(() => import('./pos/KonvaCanvas'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">캔버스 로딩 중...</p>
    </div>
  </div>
});

// 일반 React 컴포넌트들은 일반 import
import Toolbar from './pos/Toolbar';
import Sidebar from './pos/Sidebar';
import GridBackground from './pos/GridBackground';

// 상수 정의
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 10;
const BOUNDARY_PADDING = GRID_SIZE;

const StoreLayoutEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTable, setDrawingTable] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [mode, setMode] = useState('select');
  const [isClient, setIsClient] = useState(false);
  const stageRef = useRef();

  // 클라이언트 사이드에서만 렌더링
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 격자에 맞춰 좌표 정렬 헬퍼 함수
  const snapToGrid = useCallback((x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  }), []);

  // 새 테이블 추가
  const addTable = useCallback((x = 100, y = 100) => {
    const snappedPos = snapToGrid(x, y);
    const newTable = {
      id: Date.now().toString(),
      x: snappedPos.x,
      y: snappedPos.y,
      width: GRID_SIZE * 4,
      height: GRID_SIZE * 2,
      name: `테이블 ${tables.length + 1}`,
    };
    
    // 캔버스 경계선 조정
    newTable.x = Math.min(newTable.x, STAGE_WIDTH - newTable.width - BOUNDARY_PADDING);
    newTable.y = Math.min(newTable.y, STAGE_HEIGHT - newTable.height - BOUNDARY_PADDING);
    newTable.x = Math.max(0, newTable.x);
    newTable.y = Math.max(0, newTable.y);

    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id);
  }, [tables.length, snapToGrid]);

  // 테이블 선택
  const selectTable = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 테이블 속성 업데이트
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
      let newX = table.x + GRID_SIZE; 
      let newY = table.y + GRID_SIZE; 

      newX = Math.min(newX, STAGE_WIDTH - table.width - BOUNDARY_PADDING);
      newY = Math.min(newY, STAGE_HEIGHT - table.height - BOUNDARY_PADDING);
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const newTable = {
        ...table,
        id: Date.now().toString(),
        x: newX,
        y: newY,
        name: `${table.name} 복사`,
      };
      
      setTables(prev => [...prev, newTable]);
      setSelectedId(newTable.id);
    }
  }, [tables]);

  // Stage 마우스 다운 이벤트
  const handleStageMouseDown = useCallback((e) => {
    if (e.target !== e.target.getStage()) return;
    
    const pos = e.target.getPointerPosition();
    if (!pos) return;
    
    const snappedPos = snapToGrid(pos.x, pos.y);
    
    if (mode === 'draw') {
      setIsDrawing(true);
      setStartPos(snappedPos);
      setSelectedId(null);
      
      setDrawingTable({
        id: 'temp-' + Date.now(),
        x: snappedPos.x,
        y: snappedPos.y,
        width: GRID_SIZE, 
        height: GRID_SIZE, 
        name: `테이블 ${tables.length + 1}`,
      });
    } else {
      setSelectedId(null);
    }
  }, [mode, tables.length, snapToGrid]);

  // Stage 마우스 이동 이벤트
  const handleStageMouseMove = useCallback((e) => {
    if (!isDrawing || !startPos) return;

    const rawPos = e.target.getPointerPosition();
    if (!rawPos) return;

    const clampedRawX = Math.max(0, Math.min(STAGE_WIDTH - BOUNDARY_PADDING, rawPos.x));
    const clampedRawY = Math.max(0, Math.min(STAGE_HEIGHT - BOUNDARY_PADDING, rawPos.y));

    const currentSnapedPos = snapToGrid(clampedRawX, clampedRawY);

    const x1 = startPos.x;
    const y1 = startPos.y;
    const x2 = currentSnapedPos.x;
    const y2 = currentSnapedPos.y;

    let newX = Math.min(x1, x2);
    let newY = Math.min(y1, y2);
    
    let newWidth = Math.max(GRID_SIZE, Math.abs(x1 - x2) + GRID_SIZE);
    let newHeight = Math.max(GRID_SIZE, Math.abs(y1 - y2) + GRID_SIZE);

    newX = Math.max(0, Math.min(STAGE_WIDTH - newWidth - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - newHeight - BOUNDARY_PADDING, newY));
    
    const finalSnapped = snapToGrid(newX, newY);
    newX = finalSnapped.x;
    newY = finalSnapped.y;

    setDrawingTable(prev => ({
      ...prev,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    }));
  }, [isDrawing, startPos, snapToGrid]);

  // Stage 마우스 업 이벤트
  const handleStageMouseUp = useCallback(() => {
    if (isDrawing && drawingTable) {
        let finalX = drawingTable.x;
        let finalY = drawingTable.y;
        let finalWidth = drawingTable.width;
        let finalHeight = drawingTable.height;

        finalX = Math.min(finalX, STAGE_WIDTH - finalWidth - BOUNDARY_PADDING);
        finalY = Math.min(finalY, STAGE_HEIGHT - finalHeight - BOUNDARY_PADDING);
        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        const newTable = {
          ...drawingTable,
          id: Date.now().toString(),
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
        };
        setTables(prev => [...prev, newTable]);
        setSelectedId(newTable.id);
    }
    
    setIsDrawing(false);
    setDrawingTable(null);
    setStartPos(null);
  }, [isDrawing, drawingTable]);

  // Stage 클릭 이벤트
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage() && mode === 'select') {
      setSelectedId(null);
    }
  }, [mode]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Delete' && selectedId) {
        deleteTable(selectedId);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setMode('select'); 
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateTable(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, deleteTable, duplicateTable]);

  // 선택된 테이블의 이름 변경
  const updateTableName = useCallback((id, newName) => {
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, name: newName } : table
      )
    );
  }, []);

  // 모든 테이블 삭제
  const clearAll = useCallback(() => {
    if (window.confirm("모든 테이블을 삭제하시겠습니까?")) {
      setTables([]);
      setSelectedId(null);
    }
  }, []);

  // 레이아웃 저장
  const saveLayout = useCallback(() => {
    const layoutData = {
      tables,
      timestamp: new Date().toISOString(),
      canvasSize: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
    };
    
    console.log('매장 레이아웃 저장:', layoutData);
    alert('레이아웃이 저장되었습니다!');
  }, [tables]);

  // 현재 선택된 테이블 객체 찾기
  const selectedTable = tables.find(t => t.id === selectedId);

  // 클라이언트 사이드가 아니라면 로딩 표시
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">레이아웃 에디터를 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      {/* 상단 툴바 */}
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onAddTable={() => addTable()}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onClearAll={clearAll}
        onSaveLayout={saveLayout}
      />

      <div className="flex gap-4 flex-1">
        {/* 캔버스 영역 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <GridBackground visible={showGrid} />
            <KonvaCanvas
              tables={tables}
              selectedId={selectedId}
              isDrawing={isDrawing}
              drawingTable={drawingTable}
              onStageMouseDown={handleStageMouseDown}
              onStageMouseMove={handleStageMouseMove}
              onStageMouseUp={handleStageMouseUp}
              onStageClick={handleStageClick}
              onSelectTable={selectTable}
              onUpdateTable={updateTable}
              onDeleteTable={deleteTable}
              stageRef={stageRef}
            />
          </div>
        </div>

        {/* 사이드바 */}
        <Sidebar
          tables={tables}
          selectedId={selectedId}
          selectedTable={selectedTable}
          mode={mode}
          onSelectTable={setSelectedId}
          onUpdateTableName={updateTableName}
          onDuplicateTable={duplicateTable}
          onDeleteTable={deleteTable}
        />
      </div>
    </div>
  );
};

export default StoreLayoutEditor;