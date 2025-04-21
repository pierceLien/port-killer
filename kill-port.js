const detect = require('detect-port');
const readline = require('readline');
const { exec } = require('child_process');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('請輸入你想查詢並清除的 port：', async (input) => {
  const port = Number(input);

  if (isNaN(port) || port <= 0 || port > 65535) {
    console.log('❌ 無效的 port 號碼');
    rl.close();
    return;
  }

  const availablePort = await detect(port);

  if (availablePort === port) {
    console.log(`✅ Port ${port} 沒有被占用`);
    rl.close();
    return;
  }

  const platform = os.platform();

  if (platform === 'win32') {
    exec(`netstat -aon | findstr :${port}`, (err, stdout) => {
      if (!stdout) return console.log(`⚠️ 找不到使用中 port：${port}`);
      const line = stdout.trim().split('\n')[0];
      const pid = line.trim().split(/\s+/).pop();
      exec(`taskkill /PID ${pid} /F`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        rl.close();
      });
    });
  } else {
    exec(`lsof -ti :${port}`, (err, stdout) => {
      const pid = stdout.trim();
      if (!pid) return console.log(`⚠️ 找不到使用中 port：${port}`);
      exec(`kill -9 ${pid}`, (err) => {
        if (err) {
          console.error(`❌ 無法結束 PID ${pid}`, err.message);
        } else {
          console.log(`✅ 成功結束 PID ${pid}，port ${port} 已釋放`);
        }
        rl.close();
      });
    });
  }
});
