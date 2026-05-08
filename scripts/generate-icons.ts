import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svg192 = readFileSync(resolve(__dirname, '../public/icons/icon-192.svg'), 'utf-8');
const svg512 = readFileSync(resolve(__dirname, '../public/icons/icon-512.svg'), 'utf-8');

async function generateIcons() {
  console.log('生成PWA图标...');
  
  await sharp(Buffer.from(svg192))
    .resize(192, 192)
    .png()
    .toFile(resolve(__dirname, '../public/icons/icon-192.png'));
  console.log('✓ icon-192.png 生成成功');
  
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(resolve(__dirname, '../public/icons/icon-512.png'));
  console.log('✓ icon-512.png 生成成功');
  
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(resolve(__dirname, '../public/icons/icon-maskable.png'));
  console.log('✓ icon-maskable.png 生成成功');
  
  console.log('所有图标生成完成！');
}

generateIcons().catch(console.error);
