import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import ChromeExtension from 'crx';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 生成私钥
function generatePrivateKey() {
  if (!fs.existsSync('./key.pem')) {
    console.log('Generating new private key...');
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    fs.writeFileSync('./key.pem', privateKey);
    return privateKey;
  }
  return fs.readFileSync('./key.pem');
}

const crx = new ChromeExtension({
  privateKey: generatePrivateKey()
});

async function build() {
  try {
    // 打包 dist 目录
    const crxBuffer = await crx.load(resolve(__dirname, 'dist'))
      .then(crx => crx.pack());

    // 保存 .crx 文件
    fs.writeFileSync('date-countdown.crx', crxBuffer);
    console.log('CRX file has been created successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

build(); 