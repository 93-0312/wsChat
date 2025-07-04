// pages/api/socket.js
import { Server } from 'socket.io'

const users = new Map()

// 접속자 목록 브로드캐스트
function broadcastUserList(io) {
  const userList = Array.from(users.values()).map(user => user.username)
  io.emit('userList', userList)
}

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Socket.IO 서버 시작...')
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('사용자 연결됨:', socket.id)

      // 사용자 입장
      socket.on('join', (data) => {
        const { username, isAdmin } = data
        users.set(socket.id, { username, socket, isAdmin })
        
        // 입장 메시지를 모든 사용자에게 전송
        io.emit('message', {
          type: 'system',
          text: `${username}님이 입장했습니다.${isAdmin ? ' (관리자)' : ''}`,
          timestamp: new Date().toISOString()
        })

        // 접속자 목록 업데이트
        broadcastUserList(io)
        console.log(`${username} 입장 ${isAdmin ? '(관리자)' : ''}`)
      })

      // 메시지 수신 및 브로드캐스트
      socket.on('message', (data) => {
        const user = users.get(socket.id)
        if (user) {
          // 메시지를 보낸 사용자를 제외한 모든 사용자에게 전송
          socket.broadcast.emit('message', {
            type: 'message',
            text: data.text,
            username: user.username,
            timestamp: data.timestamp
          })
          
          console.log(`${user.username}: ${data.text}`)
        }
      })

      // 사용자 강퇴
      socket.on('kickUser', (data) => {
        const admin = users.get(socket.id)
        console.log('강퇴 요청:', data, '요청자:', admin)
        
        if (admin && admin.isAdmin) {
          const { targetUsername, reason } = data
          
          // 대상 사용자 찾기
          let targetSocketId = null
          for (const [socketId, user] of users.entries()) {
            if (user.username === targetUsername && !user.isAdmin) {
              targetSocketId = socketId
              break
            }
          }
          
          if (targetSocketId) {
            const targetUser = users.get(targetSocketId)
            
            // 강퇴 알림
            targetUser.socket.emit('kicked', { reason })
            
            // 강퇴 성공 알림 (관리자에게)
            socket.emit('kickSuccess', { username: targetUsername })
            
            // 시스템 메시지 (전체에게)
            io.emit('message', {
              type: 'system',
              text: `${targetUsername}님이 관리자에 의해 강퇴되었습니다. (사유: ${reason})`,
              timestamp: new Date().toISOString()
            })
            
            // 사용자 목록에서 제거
            users.delete(targetSocketId)
            
            // 접속자 목록 업데이트
            broadcastUserList(io)
            
            console.log(`${admin.username}이 ${targetUsername}을 강퇴함: ${reason}`)
          } else {
            console.log('강퇴 대상을 찾을 수 없음:', targetUsername)
          }
        } else {
          console.log('관리자 권한 없음:', admin)
        }
      })

      // 사용자 연결 해제
      socket.on('disconnect', () => {
        const user = users.get(socket.id)
        if (user) {
          // 퇴장 메시지를 모든 사용자에게 전송
          io.emit('message', {
            type: 'system',
            text: `${user.username}님이 퇴장했습니다.`,
            timestamp: new Date().toISOString()
          })
          
          users.delete(socket.id)
          
          // 접속자 목록 업데이트
          broadcastUserList(io)
          console.log(`${user.username} 퇴장`)
        }
      })
    })

    res.socket.server.io = io
  }
  
  res.end()
}