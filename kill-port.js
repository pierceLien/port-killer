#!/usr/bin/env node

const detect = require('detect-port');
const readline = require('readline');
const { exec } = require('child_process');
const os = require('os');

// 建立 readline 介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 啟動應用主流程
console.log('🚀 歡迎使用 Port Killer');

function askPort() {
  rl.question('\n🧩 請輸入你想查詢的 port：', async (input) => {
    const port = Number(input.trim());

    if (isNaN(port) || port <= 0 || port > 65535) {
      console.log('❌ 無效的 port 號碼');
      return askPort();
    }

    const availablePort = await detect(port);

    if (availablePort === port) {
      console.log(`✅ Port ${port} 沒有被占用`);
      return askNextStep();
    } else {
      console.log(`⚠️ Port ${port} 被占用中`);
      return askNextStep(port);
    }
  });
}

// 使用者選擇操作
function askNextStep(currentPort) {
  rl.question(
    '\n請選擇操作：\n1️⃣ 關閉這個 port\n2️⃣ 查詢其他 port\n3️⃣ 離開應用程式\n你的選擇是：',
    (choice) => {
      switch (choice.trim()) {
        case '1':
          if (currentPort) {
            killPort(currentPort);
          } else {
            console.log('❗目前沒有需要關閉的 port');
            askPort();
          }
          break;
        case '2':
          askPort();
          break;
        case '3':
          exitApp();
          break;
        default:
          console.log('❌ 無效選項，請重新選擇');
          askNextStep(currentPort);
      }
    }
  );
}

// 結束指定 port 的程序
function killPort(port) {
  const platform = os.platform();

  if (platform === 'win32') {
    exec(`netstat -aon | findstr :${port}`, (err, stdout) => {
      if (!stdout) {
        console.log(`⚠️ 找不到使用中 port：${port}`);
        return askNextStep();
      }
      const line = stdout.trim().split('\n')[0];
      const pid = line.trim().split(/\s+/).pop();
      exec(`taskkill /PID ${pid} /F`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        askNextStep();
      });
    });
  } else {
    exec(`lsof -ti :${port}`, (err, stdout) => {
      const pid = stdout.trim();
      if (!pid) {
        console.log(`⚠️ 找不到使用中 port：${port}`);
        return askNextStep();
      }

      exec(`kill -9 ${pid}`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        askNextStep();
      });
    });
  }
}

// 離開應用
function exitApp() {
  console.log('\n👋 感謝使用 Port Killer！下次見～');
  rl.close();
  process.exit(0);
}

// 開始執行
askPort();
