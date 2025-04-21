#!/usr/bin/env node

const detect = require('detect-port');
const readline = require('readline');
const { exec } = require('child_process');
const os = require('os');

// 建立 CLI 輸入介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 主流程
rl.question('請輸入你想查詢並清除的 port：', async (input) => {
  const port = Number(input);

  if (isNaN(port) || port <= 0 || port > 65535) {
    console.log('❌ 無效的 port 號碼');
    return exitGracefully();
  }

  const availablePort = await detect(port);

  if (availablePort === port) {
    console.log(`✅ Port ${port} 沒有被占用`);
    return exitGracefully();
  }

  const platform = os.platform();

  if (platform === 'win32') {
    exec(`netstat -aon | findstr :${port}`, (err, stdout) => {
      if (!stdout) {
        console.log(`⚠️ 找不到使用中 port：${port}`);
        return exitGracefully();
      }

      const line = stdout.trim().split('\n')[0];
      const pid = line.trim().split(/\s+/).pop();

      exec(`taskkill /PID ${pid} /F`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        exitGracefully();
      });
    });
  } else {
    exec(`lsof -ti :${port}`, (err, stdout) => {
      const pid = stdout.trim();
      if (!pid) {
        console.log(`⚠️ 找不到使用中 port：${port}`);
        return exitGracefully();
      }

      exec(`kill -9 ${pid}`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        exitGracefully();
      });
    });
  }
});

// 閃退保護，結尾按 Enter 關閉視窗
function exitGracefully() {
  rl.close();

  const pause = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  pause.question('\n🚪 按下 Enter 鍵結束程式...', () => {
    pause.close();
    process.exit(0);
  });
}
